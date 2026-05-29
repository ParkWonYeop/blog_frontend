import { MetadataRoute } from 'next';
import {
  fetchPublicPosts,
} from '@/api/publicPosts';
import { parseApiDate, SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/archive`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const postsData = await fetchPublicPosts({ size: 1000, sort: 'createdAt,desc' });
  const posts = postsData?.content || [];

  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => post.slug)
    .map((post) => ({
      url: `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: parseApiDate(post.updatedAt || post.createdAt, generatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...routes, ...postRoutes];
}
