import type { AdminComment } from '@/types';

export const getAdminCommentAuthor = (comment: AdminComment) => {
  return comment.author || comment.memberNickname || comment.guestNickname || '익명';
};
