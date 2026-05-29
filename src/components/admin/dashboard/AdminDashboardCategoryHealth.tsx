import Link from 'next/link';
import { ArrowRight, FolderTree } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Surface from '@/components/ui/Surface';
import { DashboardCategoryStat } from '@/types';

interface AdminDashboardCategoryHealthProps {
  categoryStats: DashboardCategoryStat[];
  isFallback: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return '발행 기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '발행 기록 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default function AdminDashboardCategoryHealth({
  categoryStats,
  isFallback,
}: AdminDashboardCategoryHealthProps) {
  return (
    <Surface as="section" className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <FolderTree size={19} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-bold text-[var(--color-text)]">카테고리 상태</h2>
      </div>

      {categoryStats.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)]">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.9fr_auto] gap-3 bg-[var(--window-titlebar)] px-4 py-3 text-xs font-bold text-[var(--color-text-subtle)]">
              <span>카테고리</span>
              <span>글</span>
              <span>최근 조회</span>
              <span>최근 발행</span>
              <span />
            </div>
            {categoryStats.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.name}`}
                className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.9fr_auto] gap-3 border-t border-[var(--card-border)] px-4 py-3 text-sm transition hover:bg-[var(--card-bg-strong)]"
              >
                <span className="truncate font-semibold text-[var(--color-text)]">{category.name}</span>
                <span className="text-[var(--color-text-muted)]">{category.postCount.toLocaleString()}</span>
                <span className="text-[var(--color-text-muted)]">{category.recentViewCount.toLocaleString()}</span>
                <span className="truncate text-[var(--color-text-subtle)]">{formatDate(category.lastPublishedAt)}</span>
                <ArrowRight size={15} className="text-[var(--color-text-subtle)]" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={isFallback ? '카테고리 통계 API 연결 전' : '카테고리 통계가 없습니다.'}
          description={isFallback ? '글 수, 최근 조회수, 최근 발행일은 dashboard API 연결 후 표시됩니다.' : undefined}
        />
      )}
    </Surface>
  );
}
