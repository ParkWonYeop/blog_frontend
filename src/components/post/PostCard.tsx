import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import { Post } from '@/types';

const isNoticePost = (post: Post) => {
  const categoryName = post.categoryName || '';
  return categoryName === '공지' || categoryName === '怨듭?' || categoryName.toLowerCase() === 'notice';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

function getSummary(content?: string) {
  if (!content) return '';

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export default function PostCard({ post }: { post: Post }) {
  const isNotice = isNoticePost(post);
  const summary = getSummary(post.content);

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <Surface
        as="article"
        interactive
        className="flex h-full min-h-52 flex-col p-5 shadow-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <StatusBadge tone={isNotice ? 'danger' : 'neutral'} className="shrink-0">
            {post.categoryName || '미분류'}
          </StatusBadge>
          <time className="text-xs font-medium text-[var(--color-text-subtle)]">
            {formatDate(post.createdAt)}
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
