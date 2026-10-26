'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getComments } from '@/features/comment/api';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Comment } from '@/shared/types';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentListProps {
  postSlug: string;
}

const countComments = (list: Comment[]): number => {
  return list.reduce((acc, curr) => acc + 1 + countComments(curr.children ?? []), 0);
};

export default function CommentList({ postSlug }: CommentListProps) {
  const { data: comments, isLoading, error } = useQuery({
    queryKey: queryKeys.comments.post(postSlug),
    queryFn: () => getComments(postSlug),
  });

  const totalCount = comments ? countComments(comments) : 0;

  return (
    <div>
      <h2 id="comments-heading" className="text-title4 font-bold text-[var(--color-text)]">
        댓글 <span className="tabular-nums text-[var(--color-text-subtle)]">{totalCount}</span>
      </h2>

      <div className="mt-5">
        <CommentForm postSlug={postSlug} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-[var(--color-text-subtle)]" aria-label="댓글을 불러오는 중" />
        </div>
      ) : error ? (
        <p className="py-10 text-center text-body2 text-[var(--color-text-subtle)]">댓글을 불러오지 못했어요</p>
      ) : comments && comments.length > 0 ? (
        <ul className="mt-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postSlug={postSlug} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-body2 text-[var(--color-text-subtle)]">아직 댓글이 없어요</p>
      )}
    </div>
  );
}
