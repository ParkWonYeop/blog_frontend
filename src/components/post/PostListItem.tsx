import Link from 'next/link';
import { ChevronRight, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import StatusBadge from '@/components/ui/StatusBadge';
import { Post } from '@/types';

interface PostListItemProps {
  post: Post;
  showViews?: boolean;
}

const isNoticePost = (post: Post) => {
  const categoryName = post.categoryName || '';
  return categoryName === '공지' || categoryName === '怨듭?' || categoryName.toLowerCase() === 'notice';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export default function PostListItem({ post, showViews = false }: PostListItemProps) {
  const isNotice = isNoticePost(post);

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <div
        className={clsx(
          'flex items-center justify-between gap-4 rounded-lg px-3 py-4 transition duration-150',
          isNotice ? 'hover:bg-red-500/[0.06]' : 'hover:bg-black/[0.03] dark:hover:bg-white/10',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StatusBadge tone={isNotice ? 'danger' : 'neutral'} className="hidden shrink-0 sm:inline-flex">
            {post.categoryName || '미분류'}
          </StatusBadge>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
              {post.title}
            </h3>
            <time className="mt-1 block text-xs font-medium text-[var(--color-text-subtle)]">
              {formatDate(post.createdAt)}
            </time>
          </div>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-4 text-sm text-[var(--color-text-subtle)]">
          {showViews && (
            <div className="hidden items-center gap-1.5 sm:flex" title="조회수">
              <Eye size={14} />
              <span className="text-xs">조회 {post.viewCount.toLocaleString()}</span>
            </div>
          )}
          <ChevronRight size={18} className="transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
        </div>
      </div>
    </Link>
  );
}
