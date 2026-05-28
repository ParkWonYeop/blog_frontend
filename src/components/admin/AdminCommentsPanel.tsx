'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Trash2,
  X,
} from 'lucide-react';
import { deleteAdminComment, getAdminComments } from '@/api/comments';
import { AdminComment, AdminCommentListResponse, PageMeta } from '@/types';

const PAGE_SIZE = 10;

const emptyPageMeta: PageMeta = {
  totalElements: 0,
  totalPages: 0,
  number: 0,
  last: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return `${fallback}: ${response.data.message}`;
  }

  if (error instanceof Error) return `${fallback}: ${error.message}`;

  return fallback;
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

const formatDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getAuthorName = (comment: AdminComment) => {
  return comment.author || comment.memberNickname || comment.guestNickname || '익명';
};

function DeleteCommentDialog({
  comment,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  comment: AdminComment;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-950">댓글 삭제</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              관리자 권한으로 댓글을 삭제합니다. 계속 진행할까요?
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="댓글 삭제 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="line-clamp-3 text-sm font-semibold text-red-950">{comment.content}</p>
            <p className="mt-2 text-xs text-red-700">
              {getAuthorName(comment)} · {formatDate(comment.createdAt)}
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

export default function AdminCommentsPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['comments', 'admin', { page }],
    queryFn: () => getAdminComments(page, PAGE_SIZE),
    retry: 0,
  });

  const comments = data?.content ?? [];
  const meta = getCommentListMeta(data);
  const displayTotalPages = Math.max(meta.totalPages, 1);
  const isLastPage = meta.last ?? (page + 1 >= displayTotalPages);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments'] });

      if (comments.length === 1 && page > 0) {
        setPage((currentPage) => Math.max(0, currentPage - 1));
      }

      setDeleteTarget(null);
      toast.success('댓글이 삭제되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '댓글 삭제 실패')),
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
            <MessageSquareText size={19} />
            댓글 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500">최근 댓글을 확인하고 관리자 권한으로 삭제합니다.</p>
        </div>
        <span className="rounded-full bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-500">
          {meta.totalElements.toLocaleString()}개
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="hidden grid-cols-[120px_minmax(0,1fr)_180px_96px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 md:grid">
          <span>작성자</span>
          <span>내용</span>
          <span>작성일</span>
          <span className="text-right">작업</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : comments.length > 0 ? (
          <div className={isFetching ? 'divide-y divide-gray-100 opacity-70' : 'divide-y divide-gray-100'}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="grid gap-3 px-4 py-4 transition hover:bg-gray-50 md:grid-cols-[120px_minmax(0,1fr)_180px_96px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{getAuthorName(comment)}</p>
                  <p className="mt-1 text-xs text-gray-400 md:hidden">{formatDate(comment.createdAt)}</p>
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm leading-6 text-gray-700">{comment.content}</p>
                  {comment.postTitle && (
                    <p className="mt-1 truncate text-xs text-gray-400">
                      글: {comment.postTitle}
                    </p>
                  )}
                </div>

                <span className="hidden text-sm text-gray-500 md:block">{formatDate(comment.createdAt)}</span>

                <div className="flex items-center justify-end gap-1">
                  {comment.postSlug && (
                    <Link
                      href={`/posts/${comment.postSlug}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      aria-label="댓글이 달린 글 보기"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(comment)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="댓글 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-16 text-center">
            <MessageSquareText className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="text-sm font-semibold text-gray-700">아직 관리할 댓글이 없습니다.</p>
            <p className="mt-2 text-sm text-gray-400">댓글이 작성되면 이곳에 표시됩니다.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          {isFetching && !isLoading ? '댓글을 갱신하는 중입니다.' : `페이지 ${page + 1} / ${displayTotalPages}`}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            disabled={page === 0 || isFetching}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={15} />
            이전
          </button>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={isLastPage || isFetching}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {deleteTarget && (
        <DeleteCommentDialog
          comment={deleteTarget}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}
