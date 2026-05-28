'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Eye,
  FileText,
  FolderTree,
  Loader2,
  MessageSquareText,
  PenLine,
  Settings,
  Sparkles,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { getAdminComments } from '@/api/comments';
import { getPosts } from '@/api/posts';
import { AdminComment, AdminCommentListResponse, Category, PageMeta, Post } from '@/types';

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

const formatDate = (value?: string, withTime = false) => {
  if (!value) return '-';

  const date = new Date(value);
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

const getAuthorName = (comment: AdminComment) => {
  return comment.author || comment.memberNickname || comment.guestNickname || '익명';
};

function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{post.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {post.categoryName || '미분류'} · {formatDate(post.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
        <Eye size={14} />
        <span>{post.viewCount.toLocaleString()}</span>
      </div>
    </Link>
  );
}

function CommentRow({ comment }: { comment: AdminComment }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-6 text-gray-700">{comment.content}</p>
        <p className="mt-1 truncate text-xs text-gray-400">
          {getAuthorName(comment)} · {comment.postTitle || '게시글 정보 없음'} · {formatDate(comment.createdAt, true)}
        </p>
      </div>
      <ArrowRight className="shrink-0 text-gray-300" size={15} />
    </>
  );

  if (comment.postSlug) {
    return (
      <Link
        href={`/posts/${comment.postSlug}`}
        className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3 rounded-lg px-3 py-3">{content}</div>;
}

export default function AdminPage() {
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

  const isLoading = isLatestLoading || isPopularLoading || isCategoriesLoading || isCommentsLoading;
  const latestPosts = latestData?.content ?? [];
  const popularPosts = popularData?.content ?? [];
  const recentComments = commentsData?.content ?? [];
  const totalPosts = latestData?.page?.totalElements ?? latestData?.totalElements ?? 0;
  const totalCategories = countCategories(categories);
  const totalComments = getCommentListMeta(commentsData).totalElements;
  const lastUpdatedAt = latestPosts[0]?.createdAt;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 border-b border-gray-200 pb-8 md:flex-row md:items-end">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Settings size={14} />
            Admin
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-gray-950 md:text-4xl">
            관리자 대시보드
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            공개 화면과 분리된 운영 공간입니다. 게시글, 댓글, 카테고리, 프로필 관리는 상단 메뉴에서 바로 이동합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <FileText size={17} />
            게시글 관리
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <PenLine size={17} />
            새 글 작성
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">총 게시글</span>
            <FileText size={18} />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-950">{totalPosts.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">카테고리</span>
            <FolderTree size={18} />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-950">{totalCategories.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">총 댓글</span>
            <MessageSquareText size={18} />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-950">{totalComments.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-sm font-medium">최근 업데이트</span>
            <Sparkles size={18} />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-950">{formatDate(lastUpdatedAt)}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">최근 글</h2>
              <p className="mt-1 text-sm text-gray-500">발행 흐름을 빠르게 확인합니다.</p>
            </div>
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              관리
              <ArrowRight size={15} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {latestPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 작성된 글이 없습니다.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-950">인기 글</h2>
          <p className="mt-1 text-sm text-gray-500">조회수가 높은 글을 확인합니다.</p>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : popularPosts.length > 0 ? (
            <div className="mt-4 divide-y divide-gray-100">
              {popularPosts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 집계된 인기 글이 없습니다.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">최근 댓글 5개</h2>
              <p className="mt-1 text-sm text-gray-500">새 반응을 대시보드에서 바로 봅니다.</p>
            </div>
            <Link
              href="/admin/comments"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              관리
              <ArrowRight size={15} />
            </Link>
          </div>

          {isCommentsLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : recentComments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentComments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 작성된 댓글이 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
