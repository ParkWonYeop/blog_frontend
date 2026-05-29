'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle } from 'lucide-react';
import { getComments } from '@/api/comments';
import { Comment } from '@/types';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentListProps {
  postSlug: string;
}

export default function CommentList({ postSlug }: CommentListProps) {
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postSlug],
    queryFn: () => getComments(postSlug),
  });

  const countComments = (list: Comment[]): number => {
    if (!list) return 0;
    return list.reduce((acc, curr) => acc + 1 + countComments(curr.children), 0);
  };

  const totalCount = comments ? countComments(comments) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">댓글을 불러오는 데 실패했습니다.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="text-[var(--color-accent)]" size={24} />
        <h3 className="text-xl font-bold text-[var(--color-text)]">
          댓글 <span className="text-[var(--color-accent)]">{totalCount}</span>
        </h3>
      </div>

      <div className="mb-10">
        <CommentForm postSlug={postSlug} />
      </div>

      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postSlug={postSlug} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] py-10 text-center text-sm text-[var(--color-text-muted)]">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요.
          </div>
        )}
      </div>
    </div>
  );
}
