import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicPost } from '@/api/publicPosts';
import PostDetailClient from '@/components/post/PostDetailClient';
import { DEFAULT_DESCRIPTION, getCanonicalUrl, parseApiDate, SITE_NAME, SITE_URL } from '@/lib/site';

type Props = {
  params: Promise<{ slug: string }>;
};

const getPostDescription = (content?: string) => {
  const plainText = content
    ?.replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return DEFAULT_DESCRIPTION;

  return plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText;
};

const getFirstMarkdownImage = (content?: string) => {
  const imageMatch = content?.match(/!\[.*?\]\((.*?)\)/);
  const imageUrl = imageMatch?.[1]?.split(/\s+/)[0] || '/og-image.png';

  try {
    return new URL(imageUrl, SITE_URL).toString();
  } catch {
    return new URL('/og-image.png', SITE_URL).toString();
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicPost(slug);
  const canonicalUrl = getCanonicalUrl(`/posts/${encodeURIComponent(post?.slug || slug)}`);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const description = getPostDescription(post.content);
  const imageUrl = getFirstMarkdownImage(post.content);
  const publishedTime = parseApiDate(post.createdAt).toISOString();
  const modifiedTime = parseApiDate(post.updatedAt || post.createdAt).toISOString();

  return {
    title: post.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: ['WYPark'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPublicPost(slug);

  if (!post) {
    notFound();
  }

  return <PostDetailClient slug={slug} initialPost={post} />;
}
