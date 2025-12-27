import { Metadata } from 'next';
import PostDetailClient from '@/components/post/PostDetailClient';

// 서버 사이드 메타데이터 생성을 위한 타입
type Props = {
  params: Promise<{ slug: string }>;
};

// 메타데이터용 데이터 패칭 (src/api/http.ts를 거치지 않고 직접 호출)
async function getPostForMetadata(slug: string) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${slug}`, {
      // 메타데이터는 캐시해도 되지만, 글 수정 시 반영을 위해 적절한 시간 설정
      next: { revalidate: 60 }, 
    });
    
    if (!res.ok) return null;
    
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return null;
  }
}

// 🌟 핵심: 동적 메타데이터 생성 (SEO & 카톡 공유 미리보기)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostForMetadata(slug);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  // 본문 내용을 150자로 잘라서 설명으로 사용 (마크다운 제거)
  const description = post.content
    ?.replace(/[#*`_~]/g, '')
    .replace(/\n/g, ' ')
    .substring(0, 150) + '...';

  // 썸네일 이미지 추출 (본문에 이미지가 있다면 첫 번째 이미지 사용)
  const imageMatch = post.content?.match(/!\[.*?\]\((.*?)\)/);
  const imageUrl = imageMatch ? imageMatch[1] : '/og-image.png'; // 기본 이미지

  return {
    title: post.title,
    description: description,
    openGraph: {
      title: post.title,
      description: description,
      url: `https://blog.wypark.me/posts/${slug}`,
      siteName: 'WYPark Blog',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: post.createdAt,
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

// 실제 페이지 렌더링
export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  return <PostDetailClient slug={slug} />;
}