'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/api/comments';
import { Loader2, Send } from 'lucide-react';
import { clsx } from 'clsx';

interface CommentFormProps {
  postSlug: string;
  parentId?: number | null;
  onSuccess?: () => void; // 작성 완료 후 콜백 (답글창 닫기 등)
  placeholder?: string;
}

export default function CommentForm({ postSlug, parentId = null, onSuccess, placeholder = '댓글을 남겨보세요.' }: CommentFormProps) {
  const { isLoggedIn, role } = useAuthStore();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [guestInfo, setGuestInfo] = useState({ nickname: '', password: '' });

  const mutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setContent('');
      setGuestInfo({ nickname: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      alert('댓글 작성 실패: ' + (err.response?.data?.message || err.message));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!isLoggedIn) {
      if (!guestInfo.nickname.trim() || !guestInfo.password.trim()) {
        alert('닉네임과 비밀번호를 입력해주세요.');
        return;
      }
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
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      {/* 비회원 입력 필드 */}
      {!isLoggedIn && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="닉네임"
            value={guestInfo.nickname}
            onChange={(e) => setGuestInfo({ ...guestInfo, nickname: e.target.value })}
            className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={guestInfo.password}
            onChange={(e) => setGuestInfo({ ...guestInfo, password: e.target.value })}
            className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
        </div>
      )}

      {/* 댓글 내용 입력 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isLoggedIn ? placeholder : '댓글을 남겨보세요.'}
          className="w-full p-3 pr-12 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none h-24 bg-white"
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
          title="등록"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </div>
    </form>
  );
}