import { MetadataRoute } from 'next';

interface SitemapPost {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://blog.wypark.me'; 
  // API 주소 환경변수 사용 (없으면 로컬)
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
  ];

  try {
    // 2. API에서 게시글 목록 가져오기
    const response = await fetch(`${apiUrl}/api/posts?size=1000&sort=createdAt,desc`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const json = await response.json() as { data?: { content?: SitemapPost[] } };
    const posts = json.data?.content || [];

    // 3. 게시글 데이터를 사이트맵 형식으로 변환
    const postRoutes = posts.map((post) => ({
      // 🛠️ 핵심 수정: slug를 encodeURIComponent로 감싸서 특수문자(&, 한글 등)를 안전하게 처리합니다.
      url: `${baseUrl}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: new Date(post.updatedAt || post.createdAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...routes, ...postRoutes];

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
