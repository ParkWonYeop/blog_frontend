import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Post } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';

const isNoticePost = (post: Post) => {
  return post.categoryName === '공지' || post.categoryName.toLowerCase() === 'notice';
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
  if (!content) return '본문을 열어 전체 내용을 확인해 보세요.';

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

  return (
    <Link href={`/posts/${post.slug}`} className="group block h-full">
      <Surface
        as="article"
        interactive
        className="flex h-full flex-col p-5"
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

        <p className="mt-3 line-clamp-3 flex-1 break-words text-sm leading-6 text-[var(--color-text-muted)]">
          {getSummary(post.content)}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
            읽기
            <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Surface>
    </Link>
  );
}
