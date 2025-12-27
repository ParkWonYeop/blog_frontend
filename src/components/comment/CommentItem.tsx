'use client';

import { useState } from 'react';
import { Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment, deleteAdminComment } from '@/api/comments';
import { format } from 'date-fns';
import { User, CheckCircle2, Trash2, MessageSquare, UserCheck, ShieldAlert, X } from 'lucide-react'; // X 아이콘 추가
import CommentForm from './CommentForm';
import { clsx } from 'clsx';
import toast from 'react-hot-toast'; // 🎨 Toast 추가

interface CommentItemProps {
  comment: Comment;
  postSlug: string;
  depth?: number;
}

export default function CommentItem({ comment, postSlug, depth = 0 }: CommentItemProps) {
  const { isLoggedIn, role, user } = useAuthStore();
  
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  // 🎨 비회원 삭제용 UI 상태 추가
  const [isDeleting, setIsDeleting] = useState(false);
  const [guestPassword, setGuestPassword] = useState('');

  const isAdmin = isLoggedIn && role?.includes('ADMIN');
  const isGuestComment = !comment.memberId;
  
  const isMyComment = isLoggedIn && !isGuestComment && (
    (user?.memberId && comment.memberId && user.memberId === comment.memberId) || 
    (user?.nickname === comment.author)
  );

  const showDeleteButton = isAdmin || isGuestComment || isMyComment;

  const deleteMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password?: string }) => deleteComment(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] });
      toast.success('댓글이 삭제되었습니다.');
    },
    onError: (err: any) => {
      toast.error('삭제 실패: ' + (err.response?.data?.message || '비밀번호가 틀렸습니다.'));
    },
  });

  const adminDeleteMutation = useMutation({
    mutationFn: deleteAdminComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] });
      toast.success('관리자 권한으로 삭제했습니다.');
    },
    onError: (err: any) => {
      toast.error('관리자 삭제 실패: ' + (err.response?.data?.message || err.message));
    },
  });

  const handleDeleteClick = () => {
    // A. 관리자 -> 즉시 삭제 (컨펌만)
    if (isAdmin) {
      if (confirm('관리자 권한으로 삭제하시겠습니까?')) {
        adminDeleteMutation.mutate(comment.id);
      }
      return;
    }

    // B. 내 댓글 -> 즉시 삭제 (컨펌만)
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
          comment.isPostAuthor ? "bg-blue-50/50 border border-blue-100" : "bg-white border border-gray-100"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className={clsx(
                "p-1.5 rounded-full flex items-center justify-center", 
                comment.isPostAuthor ? "bg-blue-100 text-blue-600" : 
                !isGuestComment ? "bg-green-100 text-green-600" : 
                "bg-gray-100 text-gray-500"
              )}
            >
              {comment.isPostAuthor ? <CheckCircle2 size={14} /> : 
               !isGuestComment ? <UserCheck size={14} /> : 
               <User size={14} />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <span className={clsx("text-sm font-bold flex items-center gap-1", comment.isPostAuthor ? "text-blue-700" : "text-gray-700")}>
                {comment.author}
                {comment.isPostAuthor && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full font-medium">작성자</span>}
              </span>
              <span className="text-xs text-gray-400">
                {format(new Date(comment.createdAt), 'yyyy.MM.dd HH:mm')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="답글 달기"
            >
              <MessageSquare size={14} />
            </button>
            
            {showDeleteButton && (
              <button 
                onClick={handleDeleteClick}
                className={clsx(
                  "p-1.5 rounded transition-colors",
                  isDeleting ? "bg-red-50 text-red-600" : 
                  isAdmin ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                )}
                title={isAdmin ? "관리자 삭제" : "삭제"}
              >
                {isAdmin ? <ShieldAlert size={14} /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed pl-1">
          {comment.content}
        </p>

        {/* 🎨 비회원 비밀번호 입력창 (인라인) */}
        {isDeleting && isGuestComment && (
           <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
             <input
               type="password"
               placeholder="비밀번호 입력"
               value={guestPassword}
               onChange={(e) => setGuestPassword(e.target.value)}
               className="text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 bg-white"
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
               className="p-1 text-gray-400 hover:bg-gray-200 rounded-full"
             >
               <X size={14} />
             </button>
           </div>
        )}
      </div>

      {isReplying && (
        <div className="mt-2 pl-4 border-l-2 border-gray-200 ml-4 animate-in fade-in slide-in-from-top-2">
          <CommentForm 
            postSlug={postSlug} 
            parentId={comment.id} 
            onSuccess={() => setIsReplying(false)}
            placeholder={`@${comment.author}님에게 답글 남기기`}
          />
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 pl-4 md:pl-8 border-l-2 border-gray-100 ml-2 md:ml-4 space-y-3">
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