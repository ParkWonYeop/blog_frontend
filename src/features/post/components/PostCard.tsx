import Link from 'next/link';
import { formatKoreanDate } from '@/shared/lib/dates';
import { getPostSummary, isNoticePost } from '@/features/post/lib';
import type { Post } from '@/shared/types';

export default function PostCard({ post }: { post: Post }) {
  const isNotice = isNoticePost(post, { includeAnnouncement: false });
  const summary = getPostSummary(post.content);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex h-full min-h-52 flex-col rounded-3xl border border-[var(--card-border)] p-6 transition-colors hover:border-[var(--color-text)]"
    >
      <p className="text-caption1 font-semibold text-[var(--color-text-muted)]">
        {isNotice ? '공지' : post.categoryName || '미분류'}
      </p>
      <h2 className="mt-2 line-clamp-2 break-words text-title4 font-bold text-[var(--color-text)]">
        {post.title}
      </h2>
      {summary && (
        <p className="mt-2 line-clamp-3 break-words text-body2 text-[var(--color-text-muted)]">
          {summary}
        </p>
      )}
      <time dateTime={post.createdAt} className="mt-auto pt-5 text-caption1 text-[var(--color-text-subtle)]">
        {formatKoreanDate(post.createdAt)}
      </time>
    </Link>
  );
}
