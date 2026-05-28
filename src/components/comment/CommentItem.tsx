'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment } from '@/api/comments';
import { format } from 'date-fns';
import { User, CheckCircle2, Trash2, MessageSquare, UserCheck, X } from 'lucide-react'; // X 아이콘 추가
import CommentForm from './CommentForm';
import { clsx } from 'clsx';
import toast from 'react-hot-toast'; // 🎨 Toast 추가

interface CommentItemProps {
  comment: Comment;
  postSlug: string;
  depth?: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

export default function CommentItem({ comment, postSlug, depth = 0 }: CommentItemProps) {
  const { isLoggedIn, user } = useAuthStore();
  
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  // 🎨 비회원 삭제용 UI 상태 추가
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
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] });
      toast.success('댓글이 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error(`삭제 실패: ${getErrorMessage(error, '비밀번호가 틀렸습니다.')}`);
    },
  });

  const handleDeleteClick = () => {
    if (isMyComment) {
      if (confirm('이 댓글을 삭제하시겠습니까?')) {
        deleteMutation.mutate({ id: comment.id });
      }
      return;
    }

    // C. 비회원 댓글 -> 인라인 입력창 표시 (UX 개선)
    if (isGuestComment) {
      setIsDeleting(!isDeleting);
    }
  };

  const handleGuestDeleteSubmit = () => {
    if (!guestPassword.trim()) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }
    deleteMutation.mutate({ id: comment.id, password: guestPassword });
  };

  return (
    <div className={clsx("flex flex-col", depth > 0 && "mt-3")}>
      <div 
        className={clsx(
          "relative p-4 rounded-xl transition-colors group",
          comment.isPostAuthor
            ? "border border-blue-500/15 bg-[var(--color-accent-soft)]"
            : "border border-[var(--color-line)] bg-[var(--color-surface)]"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className={clsx(
                "flex items-center justify-center rounded-full p-1.5", 
                comment.isPostAuthor ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" :
                !isGuestComment ? "bg-green-500/15 text-green-600 dark:text-green-300" : 
                "bg-black/[0.05] text-[var(--color-text-muted)] dark:bg-white/10"
              )}
            >
              {comment.isPostAuthor ? <CheckCircle2 size={14} /> : 
               !isGuestComment ? <UserCheck size={14} /> : 
               <User size={14} />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <span className={clsx("flex items-center gap-1 text-sm font-bold", comment.isPostAuthor ? "text-[var(--color-accent)]" : "text-[var(--color-text)]")}>
                {comment.author}
                {comment.isPostAuthor && <span className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">작성자</span>}
              </span>
              <span className="text-xs text-[var(--color-text-subtle)]">
                {format(new Date(comment.createdAt), 'yyyy.MM.dd HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="rounded p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              title="답글 달기"
            >
              <MessageSquare size={14} />
            </button>
            
            {showDeleteButton && (
              <button 
                onClick={handleDeleteClick}
                className={clsx(
                  "p-1.5 rounded transition-colors",
                  isDeleting ? "bg-red-500/10 text-red-600" : 
                  "text-[var(--color-text-subtle)] hover:bg-red-500/10 hover:text-red-600"
                )}
                title="삭제"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <p className="pl-1 text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* 🎨 비회원 비밀번호 입력창 (인라인) */}
        {isDeleting && isGuestComment && (
           <div className="mt-3 flex animate-in items-center gap-2 rounded-lg bg-black/[0.04] p-2 duration-200 fade-in slide-in-from-top-1 dark:bg-white/10">
             <input
               type="password"
               placeholder="비밀번호 입력"
               value={guestPassword}
               onChange={(e) => setGuestPassword(e.target.value)}
               className="rounded border border-[var(--color-line)] bg-[var(--color-control)] px-2 py-1.5 text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
               autoFocus
             />
             <button
               onClick={handleGuestDeleteSubmit}
               className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors font-medium"
             >
               삭제
             </button>
             <button
               onClick={() => { setIsDeleting(false); setGuestPassword(''); }}
               className="rounded-full p-1 text-[var(--color-text-subtle)] hover:bg-black/[0.06] dark:hover:bg-white/10"
             >
               <X size={14} />
             </button>
           </div>
        )}
      </div>

      {isReplying && (
        <div className="mt-2 ml-4 animate-in border-l-2 border-[var(--color-line)] pl-4 fade-in slide-in-from-top-2">
          <CommentForm 
            postSlug={postSlug} 
            parentId={comment.id} 
            onSuccess={() => setIsReplying(false)}
            placeholder={`@${comment.author}님에게 답글 남기기`}
          />
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 ml-2 space-y-3 border-l-2 border-[var(--color-line)] pl-4 md:ml-4 md:pl-8">
          {comment.children.map((child) => (
            <CommentItem 
              key={child.id} 
              comment={child} 
              postSlug={postSlug} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
