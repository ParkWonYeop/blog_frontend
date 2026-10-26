'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getPost } from '@/features/post/api';
import { getProfile } from '@/features/profile/api';
import { queryKeys } from '@/shared/lib/queryKeys';
import { formatKoreanDate } from '@/shared/lib/dates';
import CommentList from '@/features/comment/components/CommentList';
import MarkdownRenderer from '@/features/post/components/MarkdownRenderer';
import TOC from '@/features/post/components/TOC';
import useReadingProgress from '@/features/post/hooks/useReadingProgress';
import type { Post } from '@/shared/types';

interface PostDetailClientProps {
  slug: string;
  initialPost: Post;
}

const getPostErrorInfo = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;

    return {
      status: response?.status,
      message: response?.data?.message,
    };
  }

  return {
    status: undefined,
    message: error instanceof Error ? error.message : undefined,
  };
};

const neighborClass = 'group flex min-h-24 min-w-0 flex-col justify-center gap-1 rounded-2xl bg-[var(--color-surface)] px-5 py-4 transition-colors hover:bg-[var(--color-surface-strong)]';

export default function PostDetailClient({ slug, initialPost }: PostDetailClientProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: queryKeys.posts.detail(slug),
    queryFn: () => getPost(slug),
    enabled: !!slug,
    initialData: initialPost,
  });
  const readingProgress = useReadingProgress(contentRef, `${slug}:${post?.content ?? ''}`);

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
  });

  if (isPostLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-text-subtle)]" size={28} aria-label="불러오는 중" />
      </div>
    );
  }

  if (error || !post) {
    const { status: errorStatus, message } = getPostErrorInfo(error);
    const isAuthError = errorStatus === 401 || errorStatus === 403;

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <h1 className="text-title3 font-bold text-[var(--color-text)]">
          {isAuthError ? '볼 수 없는 글이에요' : '글을 불러오지 못했어요'}
        </h1>
        {!isAuthError && message && <p className="mt-2 text-body2 text-[var(--color-text-subtle)]">{message}</p>}
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-xl bg-[var(--color-accent)] px-6 text-body1 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const prevPost = post.prevPost;
  const nextPost = post.nextPost;
  const categoryName = post.categoryName || '미분류';
  const categoryHref = `/category/${post.categoryName ? encodeURIComponent(post.categoryName) : 'uncategorized'}`;

  return (
    <div className="mx-auto min-w-0 max-w-[1040px]">
      <div
        role="progressbar"
        aria-label="읽기 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={readingProgress}
        className="fixed inset-x-0 top-14 z-40 h-0.5"
      >
        <div className="h-full bg-[var(--color-text)]" style={{ width: `${readingProgress}%` }} />
      </div>

      <div className="relative flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:gap-14">
        <TOC key={slug} content={post.content || ''} contentRef={contentRef} />

        <article className="mx-auto w-full min-w-0 max-w-[720px] xl:mx-0 xl:flex-1">
          <header className="pb-10 md:pt-4">
            <Link href={categoryHref} className="text-body2 font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
              {categoryName}
            </Link>
            <h1 className="mt-3 break-words text-title1 font-bold text-[var(--color-text)] md:text-display">
              {post.title}
            </h1>
            <div className="mt-7 flex min-w-0 items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--color-surface)]">
                {profile?.imageUrl && (
                  <Image src={profile.imageUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-body2 font-semibold text-[var(--color-text)]">{profile?.name || 'Dev Park'}</p>
                <p className="text-caption1 text-[var(--color-text-subtle)]">
                  <time dateTime={post.createdAt}>{formatKoreanDate(post.createdAt)}</time>
                  <span className="ml-2.5 tabular-nums">조회 {post.viewCount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </header>

          <div ref={contentRef} className="min-w-0 border-t border-[var(--stroke-subtle)] pt-10">
            <MarkdownRenderer content={post.content || ''} />
          </div>

          {(prevPost || nextPost) && (
            <nav aria-label="이전 글과 다음 글" className="mt-14 grid gap-2 sm:grid-cols-2">
              {prevPost ? (
                <Link href={`/posts/${prevPost.slug}`} className={neighborClass}>
                  <span className="flex items-center gap-0.5 text-caption1 font-semibold text-[var(--color-text-subtle)]">
                    <ChevronLeft size={14} />
                    이전 글
                  </span>
                  <span className="line-clamp-2 break-words text-body1 font-semibold text-[var(--color-text)]">{prevPost.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" aria-hidden="true" />
              )}
              {nextPost && (
                <Link href={`/posts/${nextPost.slug}`} className={`${neighborClass} items-end text-right`}>
                  <span className="flex items-center gap-0.5 text-caption1 font-semibold text-[var(--color-text-subtle)]">
                    다음 글
                    <ChevronRight size={14} />
                  </span>
                  <span className="line-clamp-2 w-full break-words text-body1 font-semibold text-[var(--color-text)]">{nextPost.title}</span>
                </Link>
              )}
            </nav>
          )}

          <section aria-labelledby="comments-heading" className="mt-16 border-t border-[var(--stroke-muted)] pt-10">
            <CommentList postSlug={post.slug} />
          </section>
        </article>
      </div>
    </div>
  );
}
