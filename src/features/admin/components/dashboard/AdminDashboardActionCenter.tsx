import Link from 'next/link';
import { AlertCircle, ArrowRight, MessageSquareText, RefreshCcw, Tags } from 'lucide-react';
import EmptyState from '@/shared/ui/EmptyState';
import Surface from '@/shared/ui/Surface';
import type { DashboardActionItems } from '@/shared/types';

interface AdminDashboardActionCenterProps {
  actionItems?: DashboardActionItems;
  isFallback: boolean;
}

export default function AdminDashboardActionCenter({
  actionItems,
  isFallback,
}: AdminDashboardActionCenterProps) {
  const items = [
    {
      label: '답변 필요한 댓글',
      value: actionItems?.unansweredComments,
      href: '/admin/comments',
      icon: MessageSquareText,
    },
    {
      label: '미분류 글',
      value: actionItems?.uncategorizedPosts,
      href: '/admin/posts',
      icon: Tags,
    },
    {
      label: '오래 방치된 인기 글',
      value: actionItems?.stalePopularPosts,
      href: '/admin/posts',
      icon: RefreshCcw,
    },
  ];

  return (
    <Surface as="section" className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <AlertCircle size={19} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-bold text-[var(--color-text)]">액션 센터</h2>
      </div>

      {actionItems ? (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition hover:bg-[var(--card-bg)]"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-muted)]">
                  <Icon size={16} />
                  {item.label}
                </span>
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                  {(item.value ?? 0).toLocaleString()}
                  <ArrowRight size={15} className="text-[var(--color-text-subtle)]" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="액션 집계 연결 전"
          description={isFallback ? '관리자 대시보드 API가 준비되면 처리할 일을 모아 보여줍니다.' : '처리할 항목이 없습니다.'}
        />
      )}
    </Surface>
  );
}
