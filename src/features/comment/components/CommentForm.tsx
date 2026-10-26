'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/store';
import { createComment } from '@/features/comment/api';
import { getErrorMessage } from '@/shared/lib/errors';
import { queryKeys } from '@/shared/lib/queryKeys';

interface CommentFormProps {
  postSlug: string;
  parentId?: number | null;
  onSuccess?: () => void; // 작성 완료 후 콜백 (답글창 닫기 등)
  placeholder?: string;
}

const fieldClass = 'w-full rounded-xl border px-3.5 text-body2 text-[var(--color-text)] outline-none';

export default function CommentForm({ postSlug, parentId = null, onSuccess, placeholder = '댓글을 남겨 주세요' }: CommentFormProps) {
  const { isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [guestInfo, setGuestInfo] = useState({ nickname: '', password: '' });

  const mutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setContent('');
      setGuestInfo({ nickname: '', password: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.post(postSlug) });
      if (onSuccess) onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, '댓글을 등록하지 못했어요'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!isLoggedIn && (!guestInfo.nickname.trim() || !guestInfo.password.trim())) {
      toast.error('닉네임과 비밀번호를 입력해 주세요');
      return;
    }

    mutation.mutate({
      postSlug,
      content,
      parentId,
      guestNickname: isLoggedIn ? undefined : guestInfo.nickname,
      guestPassword: isLoggedIn ? undefined : guestInfo.password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!isLoggedIn && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            aria-label="닉네임"
            placeholder="닉네임"
            autoComplete="nickname"
            value={guestInfo.nickname}
            onChange={(e) => setGuestInfo({ ...guestInfo, nickname: e.target.value })}
            className={`${fieldClass} h-11`}
            required
          />
          <input
            type="password"
            aria-label="비밀번호"
            placeholder="비밀번호"
            autoComplete="new-password"
            value={guestInfo.password}
            onChange={(e) => setGuestInfo({ ...guestInfo, password: e.target.value })}
            className={`${fieldClass} h-11`}
            required
          />
        </div>
      )}

      <textarea
        aria-label="댓글 내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={`${fieldClass} block h-28 resize-none py-3 text-body1`}
        required
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending || !content.trim()}
          className="inline-flex h-10 min-w-16 items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 text-body2 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-control)] disabled:text-[var(--color-text-disabled)]"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} aria-label="등록하는 중" /> : '등록'}
        </button>
      </div>
    </form>
  );
}
