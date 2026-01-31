import Link from 'next/link';
import { ArrowRight, Flame, TrendingUp } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import type { DashboardPostStat } from '@/types';

interface AdminDashboardPostPerformanceProps {
  topPosts: DashboardPostStat[];
  risingPosts: DashboardPostStat[];
  stalePopularPosts: DashboardPostStat[];
  isFallback: boolean;
}

function PostStatRow({ post, isFallback }: { post: DashboardPostStat; isFallback: boolean }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-start justify-between gap-4 rounded-lg px-3 py-3 transition hover:bg-[var(--card-bg)]"
    >
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <StatusBadge>{post.categoryName || '미분류'}</StatusBadge>
          <span className="text-xs text-[var(--color-text-subtle)]">
            {isFallback ? '누적 조회' : '기간 조회'} {(isFallback ? post.viewCount : post.rangeViewCount).toLocaleString()}
          </span>
        </div>
        <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
          {post.title}
        </p>
      </div>
      <ArrowRight size={15} className="mt-5 shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function AdminDashboardPostPerformance({
  topPosts,
  risingPosts,
  stalePopularPosts,
  isFallback,
}: AdminDashboardPostPerformanceProps) {
  const secondaryPosts = risingPosts.length > 0 ? risingPosts : stalePopularPosts;

  return (
    <Surface as="section" className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <Flame size={19} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-bold text-[var(--color-text)]">콘텐츠 성과</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <Flame size={16} />
            인기 글
          </div>
          {topPosts.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)]">
              {topPosts.slice(0, 5).map((post) => (
                <PostStatRow key={post.id} post={post} isFallback={isFallback} />
              ))}
            </div>
          ) : (
            <EmptyState title="인기 글 데이터가 없습니다." className="min-h-40" />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <TrendingUp size={16} />
            {risingPosts.length > 0 ? '상승 중인 글' : '관리 후보 글'}
          </div>
          {secondaryPosts.length > 0 ? (
            <div className="divide-y divide-[var(--color-line)]">
              {secondaryPosts.slice(0, 5).map((post) => (
                <PostStatRow key={post.id} post={post} isFallback={isFallback} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={isFallback ? '통계 API 연결 전' : '관리 후보가 없습니다.'}
              description={isFallback ? '상승/방치 기준은 dashboard API 연결 후 표시됩니다.' : undefined}
              className="min-h-40"
            />
          )}
        </div>
      </div>
    </Surface>
  );
}
