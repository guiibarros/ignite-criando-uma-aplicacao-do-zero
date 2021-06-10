import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { PreviewButton } from '../../components/PreviewButton';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  nextPost: Post | null;
  previousPost: Post | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const utterancesComments = document.getElementById('utterances-comments');

    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossOrigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'guilhermebarrosjs/spacetraveling-utterances');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');

    utterancesComments.appendChild(script);
  }, []);

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Loading post | SpaceTraveling</title>
        </Head>

        <Header />
        <main className={styles.container}>
          <h1>Carregando...</h1>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </main>
      </>
    );
  }

  const formatCreatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const formatUpdatedDate = format(
    new Date(post.last_publication_date),
    "'* editado em' dd MMM yyyy', às' HH:mm",
    {
      locale: ptBR,
    }
  );

  const totalWords = post.data.content.reduce((total, content) => {
    let updatedTotal = total;

    const totalHeadingWords = content.heading?.split(' ').length ?? 0;
    const totalBodyWords = RichText.asText(content.body).split(' ').length;
    const words = totalHeadingWords + totalBodyWords;

    updatedTotal += words;
    return updatedTotal;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>

      <Header />
      <main>
        <article className={styles.post}>
          <img src={post.data.banner.url} alt={`${post.data.title} - banner`} />

          <div className={commonStyles.container}>
            <div className={styles.postHeading}>
              <h1>{post.data.title}</h1>
              <div className={commonStyles.info}>
                <div>
                  <span>
                    <FiCalendar />
                    <time dateTime={post.first_publication_date}>
                      {formatCreatedDate}
                    </time>
                  </span>
                  <span>
                    <FiUser />
                    <address>{post.data.author}</address>
                  </span>
                  <span>
                    <FiClock />
                    <time>{readTime} min</time>
                  </span>
                </div>
                <span>{formatUpdatedDate}</span>
              </div>
            </div>
            <div className={styles.postBody}>
              {post.data.content.map(content => (
                <section key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </section>
              ))}
            </div>
          </div>
        </article>
      </main>
      <footer className={commonStyles.container}>
        <div className={commonStyles.footerContent}>
          <nav className={styles.postNavigation}>
            {post.uid !== post.previousPost.uid && (
              <Link href={post.previousPost.uid}>
                <a>
                  {post.previousPost.data.title}
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}
            {post.uid !== post.nextPost.uid && (
              <Link href={post.nextPost.uid}>
                <a>
                  {post.nextPost.data.title}
                  <strong>Proximo post</strong>
                </a>
              </Link>
            )}
          </nav>
          <div id="utterances-comments" />
        </div>
      </footer>
      {preview && (
        <div className={commonStyles.container}>
          <aside className={styles.aside}>
            <PreviewButton />
          </aside>
        </div>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  );

  return {
    paths: posts.results.map(post => {
      return { params: { slug: post.uid } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(context.params.slug), {
    ref: context.previewData?.ref ?? null,
  });

  const nextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.uid,
      orderings: '[document.first_publication_date]',
    }
  );

  const previousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.uid,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    nextPost: nextPost.results[0],
    previousPost: previousPost.results[0],
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview: context.preview ?? null,
    },
    revalidate: 60 * 30,
  };
};
