import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://blog.wypark.me'; // 본인 도메인
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // 1. 고정된 정적 페이지들
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 필요하다면 /login, /signup 등 추가
  ];

  try {
    // 2. API에서 게시글 목록 가져오기
    // (기존 api/posts.ts를 쓰면 authStore의 localStorage 때문에 에러가 날 수 있어 fetch로 직접 호출합니다)
    const response = await fetch(`${apiUrl}/api/posts?size=1000&sort=createdAt,desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Next.js 캐싱 옵션: 1시간(3600초)마다 새로고침 (새 글 쓰면 1시간 뒤 반영)
      // 즉시 반영을 원하면 { cache: 'no-store' } 로 변경하세요.
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const json = await response.json();
    const posts = json.data?.content || [];

    // 3. 게시글 데이터를 사이트맵 형식으로 변환
    const postRoutes = posts.map((post: any) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...routes, ...postRoutes];

  } catch (error) {
    console.error('Sitemap generation error:', error);
    // 에러 나면 정적 페이지만이라도 반환
    return routes;
  }
}