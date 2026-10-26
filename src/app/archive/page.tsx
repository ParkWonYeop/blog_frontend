import type { Metadata } from 'next';
import { fetchPublicPosts } from '@/features/post/publicApi';
import ArchiveExplorer from '@/features/post/components/ArchiveExplorer';
import { SITE_NAME } from '@/shared/lib/site';
import type { PostListResponse } from '@/shared/types';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Archive',
  alternates: {
    canonical: '/archive',
  },
  openGraph: {
    title: `Archive | ${SITE_NAME}`,
    url: '/archive',
    siteName: SITE_NAME,
    type: 'website',
  },
};

const getTotalElements = (data?: PostListResponse | null) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

export default async function ArchivePage() {
  const data = await fetchPublicPosts({ page: 0, size: 1000, sort: 'createdAt,desc' });
  const posts = data?.content || [];
  const totalPosts = getTotalElements(data);

  return (
    <div className="mx-auto min-w-0 max-w-[1040px]">
      <h1 className="text-title1 font-bold text-[var(--color-text)] md:text-display">아카이브</h1>
      <p className="mt-1 text-body2 text-[var(--color-text-subtle)]">
        글 <span className="font-semibold tabular-nums text-[var(--color-text)]">{totalPosts.toLocaleString()}</span>개
      </p>

      <div className="mt-8">
        <ArchiveExplorer posts={posts} />
      </div>
    </div>
  );
}
