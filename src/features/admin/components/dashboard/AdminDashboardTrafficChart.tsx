import { BarChart3 } from 'lucide-react';
import EmptyState from '@/shared/ui/EmptyState';
import SegmentedControl from '@/shared/ui/SegmentedControl';
import Surface from '@/shared/ui/Surface';
import { formatKoreanDate } from '@/shared/lib/dates';
import type { DashboardRange, DashboardTrafficPoint } from '@/shared/types';

interface AdminDashboardTrafficChartProps {
  points: DashboardTrafficPoint[];
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  isFallback: boolean;
}

const rangeOptions = [
  { label: '7일', value: '7d' },
  { label: '30일', value: '30d' },
  { label: '90일', value: '90d' },
] satisfies { label: string; value: DashboardRange }[];

const formatDay = (value: string) => {
  return formatKoreanDate(value, {
    month: 'numeric',
    day: 'numeric',
  }, value);
};

export default function AdminDashboardTrafficChart({
  points,
  range,
  onRangeChange,
  isFallback,
}: AdminDashboardTrafficChartProps) {
  const maxViews = Math.max(...points.map((point) => point.views), 1);
  const hasTraffic = points.some((point) => point.views > 0);

  return (
    <Surface as="section" className="p-5">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">트래픽 흐름</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isFallback
              ? '대시보드 집계 전에는 게시글 누적 조회수로 임시 흐름을 표시합니다.'
              : '최근 기간별 조회수 흐름을 확인합니다.'}
          </p>
        </div>
        <SegmentedControl
          ariaLabel="트래픽 기간"
          options={rangeOptions}
          value={range}
          onChange={onRangeChange}
        />
      </div>

      {points.length > 0 ? (
        <>
          <div className="h-64 overflow-x-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 py-4">
            <div className="flex h-full min-w-full items-stretch gap-1.5">
              {points.map((point) => {
                const height = Math.max((point.views / maxViews) * 100, 4);

                return (
                  <div key={point.date} className="flex min-w-2 flex-1 flex-col items-center gap-2">
                    <div className="flex min-h-0 w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-[var(--color-accent)]/70 transition hover:bg-[var(--color-accent)]"
                        style={{ height: `${height}%` }}
                        title={`${formatDay(point.date)} 조회 ${point.views.toLocaleString()}`}
                      />
                    </div>
                    <span className="hidden h-4 text-[10px] font-medium text-[var(--color-text-subtle)] sm:block">
                      {formatDay(point.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {isFallback && (
            <p className="mt-3 text-xs font-medium text-[var(--color-text-subtle)]">
              {hasTraffic
                ? '임시 그래프는 글 발행일과 누적 조회수를 기준으로 계산됩니다.'
                : '집계 API가 연결되면 실제 일별 조회수로 대체됩니다.'}
            </p>
          )}
        </>
      ) : (
        <EmptyState
          title="통계 API 연결 전"
          description={isFallback ? '백엔드 집계가 준비되면 기간별 그래프가 표시됩니다.' : '표시할 트래픽 데이터가 없습니다.'}
        />
      )}
    </Surface>
  );
}
