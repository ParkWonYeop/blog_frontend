import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://blog.wypark.me'; 

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 검색 로봇이 굳이 긁어갈 필요 없는 페이지들은 차단 (글쓰기, 로그인 등)
      disallow: ['/write', '/login', '/signup', '/admin'],
    },
    // 여기서 동적으로 생성된 sitemap.xml을 가리킵니다.
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}