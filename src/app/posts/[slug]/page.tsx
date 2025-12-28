import { Metadata } from 'next';
import PostDetailClient from '@/components/post/PostDetailClient';
import { notFound } from 'next/navigation';
import { Post } from '@/types';

type Props = {
  params: Promise<{ slug: string }>;
};

// 🛠️ 서버 사이드 데이터 패칭 함수 (Metadata와 Page 양쪽에서 재사용)
async function getPostFromServer(slug: string): Promise<Post | null> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${slug}`, {
      // 캐시 설정: 60초마다 갱신 (블로그 특성상 적절)
      // 즉시 반영이 필요하다면 'no-store'로 설정하거나 revalidate: 0 사용
      next: { revalidate: 60 }, 
    });
    
    if (!res.ok) return null;
    
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Server fetch error:', error);
    return null;
  }
}

// 🌟 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostFromServer(slug);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  // 본문 요약 및 이미지 추출 로직
  const description = post.content
    ?.replace(/[#*`_~]/g, '')
    .replace(/\n/g, ' ')
    .substring(0, 150) + '...';

  const imageMatch = post.content?.match(/!\[.*?\]\((.*?)\)/);
  const imageUrl = imageMatch ? imageMatch[1] : '/og-image.png';

  return {
    title: post.title,
    description: description,
    openGraph: {
      title: post.title,
      description: description,
      url: `https://blog.wypark.me/posts/${slug}`,
      siteName: 'WYPark Blog',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: post.createdAt, // created_at 대신 createdAt 사용 주의 (타입 정의 따름)
      authors: ['WYPark'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [imageUrl],
    },
  };
}

// 🌟 실제 페이지 렌더링 (SSR 적용)
export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  
  // 1. 서버에서 데이터를 미리 가져옵니다.
  const post = await getPostFromServer(slug);

  // 2. 데이터가 없으면 404 페이지로 보냅니다. (봇에게도 404 신호를 줌)
  if (!post) {
    notFound();
  }

  // 3. 가져온 데이터를 클라이언트 컴포넌트에 'initialPost'로 넘겨줍니다.
  return <PostDetailClient slug={slug} initialPost={post} />;
}