import { CalendarClock, Eye, FileText, FolderTree, MessageSquareText } from 'lucide-react';
import MetricCard from '@/shared/ui/MetricCard';
import { formatKoreanDate } from '@/shared/lib/dates';
import type { DashboardOverview } from '@/shared/types';

interface AdminDashboardOverviewProps {
  overview?: DashboardOverview;
  fallbackTotals: {
    totalPosts: number;
    totalComments: number;
    totalCategories: number;
    lastPublishedAt?: string;
  };
}

const formatDateTime = (value?: string | null) => {
  return formatKoreanDate(value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, '최근 발행 정보 없음');
};

export default function AdminDashboardOverview({
  overview,
  fallbackTotals,
}: AdminDashboardOverviewProps) {
  const totalPosts = overview?.totalPosts ?? fallbackTotals.totalPosts;
  const totalComments = overview?.totalComments ?? fallbackTotals.totalComments;
  const totalCategories = overview?.totalCategories ?? fallbackTotals.totalCategories;
  const lastPublishedAt = overview?.lastPublishedAt ?? fallbackTotals.lastPublishedAt;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        label="오늘 조회수"
        value={overview?.todayViews.value ?? null}
        changeRate={overview?.todayViews.changeRate}
        helper="백엔드 집계가 준비되면 표시됩니다."
        disabled={!overview}
        icon={<Eye size={18} />}
      />
      <MetricCard
        label="최근 7일 조회수"
        value={overview?.weekViews.value ?? null}
        changeRate={overview?.weekViews.changeRate}
        helper="백엔드 집계가 준비되면 표시됩니다."
        disabled={!overview}
        icon={<Eye size={18} />}
      />
      <MetricCard
        label="최근 30일 조회수"
        value={overview?.monthViews.value ?? null}
        changeRate={overview?.monthViews.changeRate}
        helper="백엔드 집계가 준비되면 표시됩니다."
        disabled={!overview}
        icon={<Eye size={18} />}
      />
      <MetricCard label="총 게시글" value={totalPosts} icon={<FileText size={18} />} />
      <MetricCard label="총 댓글" value={totalComments} icon={<MessageSquareText size={18} />} />
      <MetricCard
        label="카테고리"
        value={totalCategories}
        helper={formatDateTime(lastPublishedAt)}
        icon={<FolderTree size={18} />}
      />
      {overview?.generatedAt && (
        <div className="sm:col-span-2 xl:col-span-3">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-subtle)]">
            <CalendarClock size={14} />
            마지막 집계 {formatDateTime(overview.generatedAt)}
          </p>
        </div>
      )}
    </section>
  );
}
