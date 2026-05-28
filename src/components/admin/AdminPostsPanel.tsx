'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { getCategories } from '@/api/category';
import { deletePost, getPosts } from '@/api/posts';
import { Category, PageMeta, Post, PostListResponse } from '@/types';

const PAGE_SIZE = 10;

const sortOptions = [
  { value: 'createdAt,desc', label: '최신순' },
  { value: 'createdAt,asc', label: '오래된순' },
  { value: 'viewCount,desc', label: '조회수순' },
];

const emptyPageMeta: PageMeta = {
  totalPages: 0,
  totalElements: 0,
  number: 0,
  last: true,
};

const formatDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

type CategoryOption = {
  id: number;
  name: string;
  label: string;
};

const flattenCategoryOptions = (categories: Category[] = [], depth = 0): CategoryOption[] => {
  return categories.flatMap((category) => [
    {
      id: category.id,
      name: category.name,
      label: `${'  '.repeat(depth)}${depth > 0 ? '- ' : ''}${category.name}`,
    },
    ...flattenCategoryOptions(category.children || [], depth + 1),
  ]);
};

const getPostListMeta = (data?: PostListResponse): PageMeta => {
  if (!data) return emptyPageMeta;

  return {
    totalPages: data.page?.totalPages ?? data.totalPages ?? 0,
    totalElements: data.page?.totalElements ?? data.totalElements ?? 0,
    number: data.page?.number ?? data.number ?? 0,
    last: data.page?.last ?? data.last,
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return `${fallback}: ${response.data.message}`;
  }

  if (error instanceof Error) return `${fallback}: ${error.message}`;

  return fallback;
};

function DeletePostDialog({
  post,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  post: Post;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-950">게시글 삭제</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              삭제한 글은 복구할 수 없습니다. 계속 진행할까요?
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="삭제 확인 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="line-clamp-2 text-sm font-semibold text-red-950">{post.title}</p>
            <p className="mt-1 text-xs text-red-700">
              {post.categoryName || '미분류'} · {formatDate(post.createdAt)}
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkDeletePostsDialog({
  posts,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  posts: Post[];
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-950">게시글 대량 삭제</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              선택한 게시글 {posts.length.toLocaleString()}개를 삭제합니다. 삭제한 글은 복구할 수 없습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="대량 삭제 확인 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="max-h-52 overflow-y-auto rounded-lg border border-red-100 bg-red-50">
            {posts.map((post) => (
              <div key={post.id} className="border-b border-red-100 px-4 py-3 last:border-b-0">
                <p className="line-clamp-1 text-sm font-semibold text-red-950">{post.title}</p>
                <p className="mt-1 text-xs text-red-700">
                  {post.categoryName || '미분류'} · {formatDate(post.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              선택 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPostsPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState(sortOptions[0].value);
  const [categoryName, setCategoryName] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['posts', 'admin', 'management', { page, keyword, sort, categoryName }],
    queryFn: () => getPosts({
      page,
      size: PAGE_SIZE,
      keyword: keyword || undefined,
      category: categoryName || undefined,
      sort,
    }),
    retry: 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    retry: 0,
  });

  const posts = useMemo(() => data?.content ?? [], [data?.content]);
  const meta = getPostListMeta(data);
  const displayTotalPages = Math.max(meta.totalPages, 1);
  const isLastPage = meta.last ?? (page + 1 >= displayTotalPages);
  const categoryOptions = useMemo(() => flattenCategoryOptions(categories), [categories]);
  const selectedPosts = useMemo(
    () => posts.filter((post) => selectedPostIds.has(post.id)),
    [posts, selectedPostIds],
  );
  const allPageSelected = posts.length > 0 && posts.every((post) => selectedPostIds.has(post.id));

  const resetSelection = () => {
    setSelectedPostIds(new Set());
  };

  const goToPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 0), displayTotalPages - 1);
    setPage(boundedPage);
    setPageInput(String(boundedPage + 1));
    resetSelection();
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      const deletedPost = deleteTarget;

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (deletedPost?.slug) {
        queryClient.removeQueries({ queryKey: ['post', deletedPost.slug] });
      }

      if (posts.length === 1 && page > 0) {
        goToPage(page - 1);
      }

      resetSelection();
      setDeleteTarget(null);
      toast.success('게시글이 삭제되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '게시글 삭제 실패')),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (targets: Post[]) => {
      await Promise.all(targets.map((post) => deletePost(post.id)));
      return targets;
    },
    onSuccess: async (deletedPosts) => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      deletedPosts.forEach((post) => {
        if (post.slug) queryClient.removeQueries({ queryKey: ['post', post.slug] });
      });

      if (deletedPosts.length >= posts.length && page > 0) {
        goToPage(page - 1);
      } else {
        resetSelection();
      }

      setIsBulkDeleteOpen(false);
      toast.success(`게시글 ${deletedPosts.length.toLocaleString()}개가 삭제되었습니다.`);
    },
    onError: (error) => toast.error(getErrorMessage(error, '게시글 대량 삭제 실패')),
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setPageInput('1');
    resetSelection();
    setKeyword(keywordInput.trim());
  };

  const handleClearSearch = () => {
    setKeywordInput('');
    setKeyword('');
    setPage(0);
    setPageInput('1');
    resetSelection();
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
    setPage(0);
    setPageInput('1');
    resetSelection();
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryName(event.target.value);
    setPage(0);
    setPageInput('1');
    resetSelection();
  };

  const handlePageJump = (event: React.FormEvent) => {
    event.preventDefault();

    const parsedPage = Number(pageInput);
    if (!Number.isFinite(parsedPage) || parsedPage < 1) {
      toast.error('이동할 페이지 번호를 입력해주세요.');
      setPageInput(String(page + 1));
      return;
    }

    goToPage(parsedPage - 1);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedPosts.length === 0) return;
    bulkDeleteMutation.mutate(selectedPosts);
  };

  const togglePostSelection = (id: number) => {
    setSelectedPostIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const togglePageSelection = () => {
    setSelectedPostIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (allPageSelected) {
        posts.forEach((post) => nextIds.delete(post.id));
      } else {
        posts.forEach((post) => nextIds.add(post.id));
      }

      return nextIds;
    });
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
            <FileText size={19} />
            게시글 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500">검색, 수정, 삭제를 한 화면에서 처리합니다.</p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Edit2 size={15} />
          새 글 작성
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">게시글 검색</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="제목 또는 본문 검색"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            검색
          </button>

          {keyword && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              초기화
            </button>
          )}
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <div className="text-sm text-gray-500">
            {keyword ? (
              <>
                <span className="font-semibold text-gray-900">{keyword}</span> 결과{' '}
              </>
            ) : null}
            <span className="font-semibold text-gray-900">{meta.totalElements.toLocaleString()}</span>개
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedPostIds.size > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                선택 삭제 {selectedPostIds.size.toLocaleString()}
              </button>
            )}

            <label className="flex items-center gap-2">
              <span className="sr-only">카테고리 필터</span>
              <select
                value={categoryName}
                onChange={handleCategoryChange}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">전체 카테고리</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="sr-only">게시글 정렬</span>
              <select
                value={sort}
                onChange={handleSortChange}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="hidden grid-cols-[44px_minmax(0,1fr)_130px_110px_84px_132px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 md:grid">
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={togglePageSelection}
              disabled={posts.length === 0 || isFetching}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="현재 페이지 게시글 전체 선택"
            />
          </span>
          <span>제목</span>
          <span>카테고리</span>
          <span>작성일</span>
          <span className="text-right">조회수</span>
          <span className="text-right">작업</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : posts.length > 0 ? (
          <div className={clsx('divide-y divide-gray-100', isFetching && 'opacity-70')}>
            {posts.map((post) => (
              <div
                key={post.id}
                className="grid gap-3 px-4 py-4 transition hover:bg-gray-50 md:grid-cols-[44px_minmax(0,1fr)_130px_110px_84px_132px] md:items-center"
              >
                <label className="flex items-start md:items-center md:justify-center">
                  <span className="sr-only">{post.title} 선택</span>
                  <input
                    type="checkbox"
                    checked={selectedPostIds.has(post.id)}
                    onChange={() => togglePostSelection(post.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 md:mt-0"
                  />
                </label>

                <div className="min-w-0">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="line-clamp-2 text-sm font-semibold text-gray-950 transition hover:text-blue-600"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-400 md:hidden">
                    {post.categoryName || '미분류'} · {formatDate(post.createdAt)} · 조회 {post.viewCount.toLocaleString()}
                  </p>
                </div>

                <span className="hidden truncate text-sm text-gray-500 md:block">{post.categoryName || '미분류'}</span>
                <span className="hidden text-sm text-gray-500 md:block">{formatDate(post.createdAt)}</span>
                <span className="hidden text-right text-sm tabular-nums text-gray-500 md:block">
                  {post.viewCount.toLocaleString()}
                </span>

                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`${post.title} 보기`}
                  >
                    <Eye size={16} />
                  </Link>
                  <Link
                    href={`/admin/posts/${post.slug}/edit`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                    aria-label={`${post.title} 수정`}
                  >
                    <Edit2 size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(post)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`${post.title} 삭제`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-16 text-center">
            <FileText className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="text-sm font-semibold text-gray-700">
              {keyword ? '검색 조건에 맞는 게시글이 없습니다.' : '아직 작성된 글이 없습니다.'}
            </p>
            <p className="mt-2 text-sm text-gray-400">새 글을 작성하면 이곳에서 바로 관리할 수 있습니다.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          {isFetching && !isLoading ? '목록을 갱신하는 중입니다.' : `페이지 ${page + 1} / ${displayTotalPages}`}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0 || isFetching}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={15} />
            이전
          </button>
          <form onSubmit={handlePageJump} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={displayTotalPages}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              disabled={isFetching}
              className="h-9 w-20 rounded-full border border-gray-200 px-3 text-center text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              aria-label="이동할 페이지 번호"
            />
            <button
              type="submit"
              disabled={isFetching}
              className="inline-flex h-9 items-center justify-center rounded-full border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이동
            </button>
          </form>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={isLastPage || isFetching}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {deleteTarget && (
        <DeletePostDialog
          post={deleteTarget}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {isBulkDeleteOpen && selectedPosts.length > 0 && (
        <BulkDeletePostsDialog
          posts={selectedPosts}
          isDeleting={bulkDeleteMutation.isPending}
          onCancel={() => setIsBulkDeleteOpen(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      )}
    </section>
  );
}
