import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
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

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

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

  const formatDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
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
                <span>
                  <FiCalendar />
                  <time dateTime={post.first_publication_date}>
                    {formatDate}
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
  const response = await prismic.getByUID(
    'post',
    String(context.params.slug),
    {}
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    },
    revalidate: 60 * 30,
  };
};
