import type { Post } from '@/shared/types';

/** Complete when the bottom of the article body reaches the viewport, regardless of comments. */
export function getReadingProgress({ top, height }: { top: number; height: number }, viewportHeight: number): number {
  if (height <= 0 || viewportHeight <= 0) return 0;
  if (height <= viewportHeight) return top + height <= viewportHeight ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((-top / (height - viewportHeight)) * 100)));
}

const NOTICE_CATEGORY_NAMES = new Set(['공지', 'notice']);

type NoticeMatchOptions = {
  includeAnnouncement?: boolean;
};

export const isNoticePost = (
  post: Pick<Post, 'categoryName'>,
  options?: NoticeMatchOptions,
) => {
  return isNoticeCategoryName(post.categoryName, options);
};

export const isNoticeCategoryName = (
  categoryName = '',
  { includeAnnouncement = true }: NoticeMatchOptions = {},
) => {
  const normalizedName = categoryName.toLowerCase();
  return NOTICE_CATEGORY_NAMES.has(normalizedName)
    || (includeAnnouncement && normalizedName === 'announcement');
};

export const getPostSummary = (content?: string, maxLength = 120) => {
  if (!content) return '';

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};
