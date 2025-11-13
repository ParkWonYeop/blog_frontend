import type { Post } from '@/types';

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
