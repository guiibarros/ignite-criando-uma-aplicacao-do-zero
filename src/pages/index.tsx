import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import { PreviewButton } from '../components/PreviewButton';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [next_page, setNext_page] = useState(postsPagination.next_page);

  function handlePaginate(): void {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(response => {
        const postsResults = response.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: post.data,
          };
        });

        setPosts([...posts, ...postsResults]);
        setNext_page(response.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>

      <div className={commonStyles.container}>
        <main>
          <div className={styles.content}>
            <h1>
              <img src="/Logo.svg" alt="logo" />
            </h1>

            <section className={styles.posts}>
              {posts.map(post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a className={styles.post}>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div className={commonStyles.info}>
                      <span>
                        <FiCalendar />
                        <time dateTime={post.first_publication_date}>
                          {format(
                            new Date(post.first_publication_date),
                            'dd MMM yyyy',
                            {
                              locale: ptBR,
                            }
                          )}
                        </time>
                      </span>
                      <span>
                        <FiUser />
                        <address>{post.data.author}</address>
                      </span>
                    </div>
                  </a>
                </Link>
              ))}
            </section>
            {next_page && (
              <button onClick={handlePaginate} type="button">
                Carregar mais posts
              </button>
            )}
          </div>
        </main>
        {preview && (
          <aside>
            <PreviewButton />
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { ref: previewData?.ref ?? null }
  );

  const posts = postsResponse.results.map((post: Post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60 * 30, // 30 Minutes
  };
};
