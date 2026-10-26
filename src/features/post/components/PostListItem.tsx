import Link from 'next/link';
import { formatKoreanNumericDate } from '@/shared/lib/dates';
import { getPostSummary, isNoticePost } from '@/features/post/lib';
import type { Post } from '@/shared/types';

interface PostListItemProps {
  post: Post;
  showViews?: boolean;
  withSummary?: boolean;
}

export default function PostListItem({ post, showViews = false, withSummary = false }: PostListItemProps) {
  const isNotice = isNoticePost(post, { includeAnnouncement: false });
  const summary = withSummary ? getPostSummary(post.content, 110) : '';

  return (
    <li className="border-b border-[var(--stroke-subtle)] last:border-b-0">
      <Link
        href={`/posts/${post.slug}`}
        className="group -mx-2 flex min-w-0 flex-col gap-1 rounded-xl px-2 py-4 transition-colors hover:bg-[var(--color-hover)] active:bg-[var(--color-pressed)]"
      >
        <h3 className="line-clamp-2 break-words text-body1 font-semibold text-[var(--color-text)]">
          {isNotice && <span className="mr-1.5 font-bold">[공지]</span>}
          {post.title}
        </h3>
        {summary && (
          <p className="line-clamp-2 break-words text-body2 text-[var(--color-text-muted)]">{summary}</p>
        )}
        <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 text-caption1 text-[var(--color-text-subtle)]">
          <span className="font-medium text-[var(--color-text-muted)]">{post.categoryName || '미분류'}</span>
          <time dateTime={post.createdAt} className="tabular-nums">{formatKoreanNumericDate(post.createdAt)}</time>
          {showViews && <span className="tabular-nums">조회 {post.viewCount.toLocaleString()}</span>}
        </p>
      </Link>
    </li>
  );
}
