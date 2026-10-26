'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/store';
import { deleteComment } from '@/features/comment/api';
import { getErrorMessage } from '@/shared/lib/errors';
import { queryKeys } from '@/shared/lib/queryKeys';
import StatusBadge from '@/shared/ui/StatusBadge';
import type { Comment } from '@/shared/types';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  postSlug: string;
  depth?: number;
}

const textButtonClass = 'inline-flex h-8 items-center font-semibold transition-colors hover:text-[var(--color-text)]';

export default function CommentItem({ comment, postSlug, depth = 0 }: CommentItemProps) {
  const { isLoggedIn, user } = useAuthStore();

  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guestPassword, setGuestPassword] = useState('');

  const isGuestComment = !comment.memberId;

  const isMyComment = isLoggedIn && !isGuestComment && (
    (user?.memberId && comment.memberId && user.memberId === comment.memberId) ||
    (user?.nickname === comment.author)
  );

  const showDeleteButton = isGuestComment || isMyComment;

  const deleteMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password?: string }) => deleteComment(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.post(postSlug) });
      toast.success('댓글을 삭제했어요');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '비밀번호를 확인해 주세요'));
    },
  });

  const handleDeleteClick = () => {
    if (isMyComment) {
      if (confirm('댓글을 삭제할까요?')) {
        deleteMutation.mutate({ id: comment.id });
      }
      return;
    }

    if (isGuestComment) {
      setIsDeleting(!isDeleting);
    }
  };

  const handleGuestDeleteSubmit = () => {
    if (!guestPassword.trim()) {
      toast.error('비밀번호를 입력해 주세요');
      return;
    }
    deleteMutation.mutate({ id: comment.id, password: guestPassword });
  };

  return (
    <li className={clsx(depth === 0 ? 'border-b border-[var(--stroke-subtle)] py-5 last:border-b-0' : 'pt-5')}>
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-body2 font-bold',
            comment.isPostAuthor ? 'bg-[var(--color-inverse)] text-[var(--color-on-inverse)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
          )}
        >
          {comment.author.slice(0, 1)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5">
            <span className="truncate text-body2 font-semibold text-[var(--color-text)]">{comment.author}</span>
            {comment.isPostAuthor && <StatusBadge tone="success">작성자</StatusBadge>}
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-body1 text-[var(--color-text)]">
            {comment.content}
          </p>

          <div className="mt-1 flex items-center gap-3 text-caption1 text-[var(--color-text-subtle)]">
            <time dateTime={comment.createdAt} className="tabular-nums">{format(new Date(comment.createdAt), 'yyyy.MM.dd HH:mm')}</time>
            <button type="button" onClick={() => setIsReplying(!isReplying)} aria-expanded={isReplying} className={textButtonClass}>
              답글 쓰기
            </button>
            {showDeleteButton && (
              <button
                type="button"
                onClick={handleDeleteClick}
                aria-expanded={isGuestComment ? isDeleting : undefined}
                className={clsx(textButtonClass, 'hover:text-[var(--color-danger)]')}
              >
                삭제
              </button>
            )}
          </div>

          {isDeleting && isGuestComment && (
            <div className="mt-2 flex max-w-sm items-center gap-2">
              <input
                type="password"
                aria-label="댓글 비밀번호"
                placeholder="비밀번호"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-body2 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleGuestDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="h-10 shrink-0 rounded-lg bg-[var(--color-danger)] px-3.5 text-body2 font-semibold text-[var(--color-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={() => { setIsDeleting(false); setGuestPassword(''); }}
                className="h-10 shrink-0 rounded-lg px-3 text-body2 font-semibold text-[var(--color-text-subtle)] hover:bg-[var(--color-hover)]"
              >
                닫기
              </button>
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                postSlug={postSlug}
                parentId={comment.id}
                onSuccess={() => setIsReplying(false)}
                placeholder={`${comment.author}님에게 답글 남기기`}
              />
            </div>
          )}

          {comment.children && comment.children.length > 0 && (
            <ul>
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  postSlug={postSlug}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
