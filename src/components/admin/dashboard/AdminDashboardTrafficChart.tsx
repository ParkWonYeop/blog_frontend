import { BarChart3 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Surface from '@/components/ui/Surface';
import { DashboardRange, DashboardTrafficPoint } from '@/types';

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date);
};

export default function AdminDashboardTrafficChart({
  points,
  range,
  onRangeChange,
  isFallback,
}: AdminDashboardTrafficChartProps) {
  const maxViews = Math.max(...points.map((point) => point.views), 1);

  return (
    <Surface as="section" className="p-5">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">트래픽 흐름</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            최근 기간별 조회수 흐름을 확인합니다.
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
        <div className="flex h-64 items-end gap-1.5 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-control)] px-3 py-4">
          {points.map((point) => {
            const height = Math.max((point.views / maxViews) * 100, 4);

            return (
              <div key={point.date} className="flex min-w-2 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-[var(--color-accent)]/70 transition hover:bg-[var(--color-accent)]"
                  style={{ height: `${height}%` }}
                  title={`${formatDay(point.date)} 조회 ${point.views.toLocaleString()}`}
                />
                <span className="hidden text-[10px] font-medium text-[var(--color-text-subtle)] sm:block">
                  {formatDay(point.date)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="통계 API 연결 전"
          description={isFallback ? '백엔드 집계가 준비되면 기간별 그래프가 표시됩니다.' : '표시할 트래픽 데이터가 없습니다.'}
        />
      )}
    </Surface>
  );
}
