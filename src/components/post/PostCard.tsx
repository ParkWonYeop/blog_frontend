import Link from 'next/link';
import { FileText } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import { formatKoreanDate } from '@/lib/dates';
import { getPostSummary, isNoticePost } from '@/lib/posts';
import type { Post } from '@/types';

export default function PostCard({ post }: { post: Post }) {
  const isNotice = isNoticePost(post, { includeAnnouncement: false });
  const summary = getPostSummary(post.content);

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <Surface
        as="article"
        interactive
        className="flex h-full min-h-52 flex-col p-5 shadow-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-bg-strong)] text-[var(--color-accent)] shadow-[var(--shadow-control)]">
              <FileText size={17} />
            </span>
            <StatusBadge tone={isNotice ? 'danger' : 'neutral'} className="shrink-0">
              {post.categoryName || '미분류'}
            </StatusBadge>
          </div>
          <time className="text-xs font-medium text-[var(--color-text-subtle)]">
            {formatKoreanDate(post.createdAt)}
          </time>
        </div>

        <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-normal text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
          {post.title}
        </h2>

        {summary && (
          <p className="mt-3 line-clamp-3 flex-1 break-words text-sm leading-6 text-[var(--color-text-muted)]">
            {summary}
          </p>
        )}
      </Surface>
    </Link>
  );
}
