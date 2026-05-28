'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Loader2,
  PenLine,
  Settings,
} from 'lucide-react';
import { getAdminDashboard } from '@/api/dashboard';
import { getCategories } from '@/api/category';
import { getAdminComments } from '@/api/comments';
import { getPosts } from '@/api/posts';
import AdminDashboardActionCenter from '@/components/admin/dashboard/AdminDashboardActionCenter';
import AdminDashboardCategoryHealth from '@/components/admin/dashboard/AdminDashboardCategoryHealth';
import AdminDashboardOverview from '@/components/admin/dashboard/AdminDashboardOverview';
import AdminDashboardPostPerformance from '@/components/admin/dashboard/AdminDashboardPostPerformance';
import AdminDashboardTrafficChart from '@/components/admin/dashboard/AdminDashboardTrafficChart';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import {
  AdminComment,
  AdminCommentListResponse,
  Category,
  DashboardPostStat,
  DashboardRange,
  PageMeta,
  Post,
} from '@/types';

const countCategories = (categories: Category[] = []): number => {
  return categories.reduce((count, category) => {
    return count + 1 + countCategories(category.children || []);
  }, 0);
};

const emptyPageMeta: PageMeta = {
  totalPages: 0,
  totalElements: 0,
  number: 0,
  last: true,
};

const formatDate = (value?: string | Date, withTime = false) => {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

const getCommentListMeta = (data?: AdminCommentListResponse): PageMeta => {
  if (!data) return emptyPageMeta;

  return {
    totalElements: data.page?.totalElements ?? data.totalElements ?? 0,
    totalPages: data.page?.totalPages ?? data.totalPages ?? 0,
    number: data.page?.number ?? data.number ?? 0,
    last: data.page?.last ?? data.last,
  };
};

const getPostTotal = (data?: { page?: PageMeta; totalElements?: number }) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

const getAuthorName = (comment: AdminComment) => {
  return comment.author || comment.memberNickname || comment.guestNickname || '익명';
};

const toPostStat = (post: Post): DashboardPostStat => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  categoryName: post.categoryName,
  viewCount: post.viewCount,
  rangeViewCount: post.viewCount,
  createdAt: post.createdAt,
});

function RecentPostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition hover:bg-black/[0.03] dark:hover:bg-white/10"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">{post.title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
          {post.categoryName || '미분류'} · {formatDate(post.createdAt)}
        </p>
      </div>
      <ArrowRight className="shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5" size={15} />
    </Link>
  );
}

function RecentCommentRow({ comment }: { comment: AdminComment }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{comment.content}</p>
        <p className="mt-1 truncate text-xs text-[var(--color-text-subtle)]">
          {getAuthorName(comment)} · {comment.postTitle || '게시글 정보 없음'} · {formatDate(comment.createdAt, true)}
        </p>
      </div>
      <ArrowRight className="shrink-0 text-[var(--color-text-subtle)]" size={15} />
    </>
  );

  if (comment.postSlug) {
    return (
      <Link
        href={`/posts/${comment.postSlug}`}
        className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-black/[0.03] dark:hover:bg-white/10"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 rounded-lg px-3 py-3">{content}</div>;
}

function RecentActivity({
  posts,
  comments,
  isLoading,
}: {
  posts: Post[];
  comments: AdminComment[];
  isLoading: boolean;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">최근 글</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">발행 흐름을 빠르게 확인합니다.</p>
          </div>
          <Link href="/admin/posts" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
            관리
            <ArrowRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
          </div>
        ) : posts.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {posts.slice(0, 5).map((post) => (
              <RecentPostRow key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="아직 작성된 글이 없습니다." />
        )}
      </Surface>

      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">최근 댓글</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">새 반응을 대시보드에서 바로 봅니다.</p>
          </div>
          <Link href="/admin/comments" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
            관리
            <ArrowRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-[var(--color-line)]">
            {comments.slice(0, 5).map((comment) => (
              <RecentCommentRow key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <EmptyState title="아직 작성된 댓글이 없습니다." />
        )}
      </Surface>
    </section>
  );
}

export default function AdminPage() {
  const [range, setRange] = useState<DashboardRange>('30d');

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
  } = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => getAdminDashboard(range),
    retry: 0,
  });

  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['posts', 'admin', 'latest'],
    queryFn: () => getPosts({ size: 5, sort: 'createdAt,desc' }),
    retry: 0,
  });

  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['posts', 'admin', 'popular'],
    queryFn: () => getPosts({ size: 5, sort: 'viewCount,desc' }),
    retry: 0,
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    retry: 0,
  });

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', 'admin', 'recent'],
    queryFn: () => getAdminComments(0, 5),
    retry: 0,
  });

  const latestPosts = latestData?.content ?? [];
  const recentComments = dashboard?.recentComments ?? commentsData?.content ?? [];
  const recentPosts = dashboard?.recentPosts ?? latestPosts;
  const totalPosts = dashboard?.overview.totalPosts ?? getPostTotal(latestData);
  const totalCategories = dashboard?.overview.totalCategories ?? countCategories(categories);
  const totalComments = dashboard?.overview.totalComments ?? getCommentListMeta(commentsData).totalElements;
  const isFallback = !dashboard;
  const isFallbackLoading = isLatestLoading || isPopularLoading || isCategoriesLoading || isCommentsLoading;
  const topPosts = useMemo(
    () => dashboard?.topPosts ?? (popularData?.content ?? []).map(toPostStat),
    [dashboard?.topPosts, popularData?.content],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 border-b border-[var(--color-line)] pb-8 md:flex-row md:items-end">
        <div>
          <StatusBadge tone="info" className="mb-3">
            <Settings size={14} />
            관리자
          </StatusBadge>
          <h1 className="text-3xl font-bold tracking-normal text-[var(--color-text)] md:text-4xl">
            관리자 대시보드
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            공개 화면과 분리된 운영 공간입니다. 통계 API가 준비되기 전에도 기존 데이터로 운영 흐름을 확인합니다.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-subtle)]">
            <CalendarClock size={14} />
            오늘 {formatDate(new Date())}
            {isDashboardLoading && ' · 통계 API 확인 중'}
            {isFallback && !isDashboardLoading && ' · fallback 데이터 사용 중'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-control)] px-5 py-3 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] transition hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]"
          >
            <FileText size={17} />
            게시글 관리
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-control)] transition hover:bg-[var(--color-accent-hover)]"
          >
            <PenLine size={17} />
            새 글 작성
          </Link>
        </div>
      </header>

      <AdminDashboardOverview
        overview={dashboard?.overview}
        fallbackTotals={{
          totalPosts,
          totalComments,
          totalCategories,
          lastPublishedAt: latestPosts[0]?.createdAt,
        }}
      />

      <AdminDashboardTrafficChart
        points={dashboard?.traffic ?? []}
        range={range}
        onRangeChange={setRange}
        isFallback={isFallback}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <AdminDashboardPostPerformance
          topPosts={topPosts}
          risingPosts={dashboard?.risingPosts ?? []}
          stalePopularPosts={dashboard?.stalePopularPosts ?? []}
          isFallback={isFallback}
        />
        <AdminDashboardActionCenter
          actionItems={dashboard?.actionItems}
          isFallback={isFallback}
        />
      </div>

      <RecentActivity
        posts={recentPosts}
        comments={recentComments}
        isLoading={isFallbackLoading}
      />

      <AdminDashboardCategoryHealth
        categoryStats={dashboard?.categoryStats ?? []}
        isFallback={isFallback}
      />
    </div>
  );
}
