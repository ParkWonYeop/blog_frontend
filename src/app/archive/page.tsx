import type { Metadata } from 'next';
import { Archive } from 'lucide-react';
import { fetchPublicPosts } from '@/api/publicPosts';
import ArchiveExplorer from '@/components/post/ArchiveExplorer';
import WindowSurface from '@/components/ui/WindowSurface';
import { SITE_NAME } from '@/lib/site';
import type { PostListResponse } from '@/types';

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
    <div className="mx-auto min-w-0 max-w-[1180px] px-0 py-3 md:py-6">
      <WindowSurface
        title="Finder"
        subtitle={`Archive · ${totalPosts.toLocaleString()} posts`}
        bodyClassName="p-4 md:p-7"
      >
        <div className="mb-7 min-w-0 border-b border-[var(--color-line)] pb-6 text-center md:text-left">
          <h1 className="mb-3 flex min-w-0 items-center justify-center gap-3 text-3xl font-bold tracking-normal text-[var(--color-text)] md:justify-start">
            <Archive className="shrink-0 text-[var(--color-accent)]" size={32} />
            <span className="min-w-0 break-words">아카이브</span>
          </h1>
          <p className="break-words text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            지금까지 작성한 <span className="font-bold text-[var(--color-accent)]">{totalPosts.toLocaleString()}</span>개의 글을 기록 순서로 정리했습니다.
          </p>
        </div>

        <ArchiveExplorer posts={posts} />
      </WindowSurface>
    </div>
  );
}
