'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Loader2, Monitor, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPost } from '@/api/posts';
import { getProfile } from '@/api/profile';
import { queryKeys } from '@/lib/queryKeys';
import CommentList from '@/components/comment/CommentList';
import MarkdownRenderer from '@/components/post/MarkdownRenderer';
import TOC from '@/components/post/TOC';
import StatusBadge from '@/components/ui/StatusBadge';
import Surface from '@/components/ui/Surface';
import WindowSurface from '@/components/ui/WindowSurface';
import type { Post } from '@/types';

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

export default function PostDetailClient({ slug, initialPost }: PostDetailClientProps) {
  const router = useRouter();

  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: queryKeys.posts.detail(slug),
    queryFn: () => getPost(slug),
    enabled: !!slug,
    initialData: initialPost,
  });

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
  });

  if (isPostLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
      </div>
    );
  }

  if (error || !post) {
    const { status: errorStatus, message } = getPostErrorInfo(error);
    const errorMessage = message || '게시글을 찾을 수 없습니다.';
    const isAuthError = errorStatus === 401 || errorStatus === 403;

    return (
      <WindowSurface className="mx-auto max-w-[980px]" bodyClassName="px-4 py-20 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="text-[var(--color-text-subtle)]" size={64} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
          {isAuthError ? '접근 권한이 없습니다.' : '게시글을 불러올 수 없습니다.'}
        </h2>
        <p className="mb-6 text-[var(--color-text-muted)]">
          {isAuthError ? '로그인이 필요하거나 비공개 게시글일 수 있습니다.' : errorMessage}
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-5 py-2.5 font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--card-bg-strong)]"
        >
          메인으로
        </button>
      </WindowSurface>
    );
  }

  const prevPost = post.prevPost;
  const nextPost = post.nextPost;

  return (
    <div className="mx-auto min-w-0 max-w-[1120px] px-0 py-3 md:py-6">
      <Link href="/" className="mb-5 inline-flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-control)] backdrop-blur-[18px] transition-colors hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-accent)]">
        <ArrowLeft size={18} />
        <span>Finder로</span>
      </Link>

      <div className="relative grid min-w-0 gap-6 xl:grid-cols-[minmax(0,820px)_220px] xl:justify-center xl:gap-8">
        <div className="min-w-0 space-y-6">
          <WindowSurface
            as="article"
            title="Reader"
            subtitle={post.categoryName || '미분류'}
            className="mx-auto w-full max-w-[820px]"
            bodyClassName="px-5 py-7 md:px-10 md:py-10"
            controls={(
              <div className="hidden items-center gap-1.5 text-xs font-semibold text-[var(--color-text-subtle)] sm:flex">
                <Monitor size={14} />
                <span className="max-w-44 truncate">{post.slug}</span>
              </div>
            )}
          >
            <header className="mb-9 border-b border-[var(--color-line)] pb-7">
              <StatusBadge tone="neutral" className="mb-5">
                {post.categoryName || '미분류'}
              </StatusBadge>
              <h1 className="mb-6 break-words text-3xl font-bold leading-tight tracking-normal text-[var(--color-text)] md:text-4xl lg:text-[2.75rem]">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--color-text-muted)]">
                <div className="flex min-w-0 items-center gap-2">
                  {profile?.imageUrl ? (
                    <Image
                      src={profile.imageUrl}
                      alt="작성자"
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full border border-[var(--color-line)] object-cover shadow-sm"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/10">
                      <User size={16} />
                    </div>
                  )}
                  <span className="min-w-0 truncate font-bold text-[var(--color-text)]">{profile?.name || 'Dev Park'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </header>

            <div className="prose prose-base min-w-0 max-w-none break-words prose-headings:font-bold prose-headings:tracking-normal prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text)] prose-p:leading-8 prose-strong:text-[var(--color-text)] prose-li:text-[var(--color-text-muted)] prose-li:leading-8 prose-a:text-[var(--color-accent)] prose-hr:border-[var(--color-line)] prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 md:prose-lg [overflow-wrap:anywhere]">
              <MarkdownRenderer content={post.content || ''} />
            </div>
          </WindowSurface>

          <WindowSurface title="Navigation" showTrafficLights={false} className="mx-auto max-w-[820px]" bodyClassName="p-4 md:p-5">
            <nav className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {prevPost ? (
                <Link href={`/posts/${prevPost.slug}`} className="group flex min-w-0 flex-col items-start gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--card-bg-strong)] md:p-5">
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-accent)]">
                    <ChevronLeft size={16} />
                    이전 글
                  </span>
                  <span className="line-clamp-2 w-full break-words text-left font-bold text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]">
                    {prevPost.title}
                  </span>
                </Link>
              ) : (
                <Surface className="hidden w-full cursor-not-allowed p-5 opacity-60 md:block">
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)]">
                    <ChevronLeft size={16} />
                    이전 글 없음
                  </span>
                </Surface>
              )}

              {nextPost ? (
                <Link href={`/posts/${nextPost.slug}`} className="group flex min-w-0 flex-col items-end gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--card-bg-strong)] md:p-5">
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-accent)]">
                    다음 글
                    <ChevronRight size={16} />
                  </span>
                  <span className="line-clamp-2 w-full break-words text-right font-bold text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]">
                    {nextPost.title}
                  </span>
                </Link>
              ) : (
                <Surface className="hidden w-full cursor-not-allowed flex-col items-end gap-1 p-5 opacity-60 md:flex">
                  <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)]">
                    다음 글 없음
                    <ChevronRight size={16} />
                  </span>
                </Surface>
              )}
            </nav>
          </WindowSurface>

          <WindowSurface title="Comments" showTrafficLights={false} className="mx-auto max-w-[820px]" bodyClassName="p-5 md:p-6">
            <CommentList postSlug={post.slug} />
          </WindowSurface>
        </div>

        <aside className="hidden w-[220px] shrink-0 xl:block">
          <WindowSurface title="목차" showTrafficLights={false} bodyClassName="p-4" className="sticky top-16 shadow-[var(--shadow-card)]">
            <TOC content={post.content || ''} />
          </WindowSurface>
        </aside>
      </div>
    </div>
  );
}
