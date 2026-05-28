'use client';

import { useQuery } from '@tanstack/react-query';
import { getComments } from '@/api/comments';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { Loader2, MessageCircle } from 'lucide-react';
import { Comment } from '@/types';

interface CommentListProps {
  postSlug: string;
}

export default function CommentList({ postSlug }: CommentListProps) {
  // 댓글 목록 조회
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postSlug],
    queryFn: () => getComments(postSlug),
  });

  // 총 댓글 수 계산 (재귀)
  const countComments = (list: Comment[]): number => {
    if (!list) return 0;
    return list.reduce((acc, curr) => acc + 1 + countComments(curr.children), 0);
  };

  const totalCount = comments ? countComments(comments) : 0;

  if (isLoading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">댓글을 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="mt-16 border-t border-[var(--color-line)] pt-10">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-[var(--color-text)]">
          댓글 <span className="text-blue-600">{totalCount}</span>
        </h3>
      </div>

      {/* 최상위 댓글 작성 폼 */}
      <div className="mb-10">
        <CommentForm postSlug={postSlug} />
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postSlug={postSlug} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-white/45 py-10 text-center text-sm text-[var(--color-text-muted)] dark:bg-white/5">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </div>
        )}
      </div>
    </div>
  );
}
