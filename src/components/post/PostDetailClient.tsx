'use client';

import { useQuery } from '@tanstack/react-query';
import { getPost } from '@/api/posts';
import { getProfile } from '@/api/profile';
import MarkdownRenderer from '@/components/post/MarkdownRenderer';
import CommentList from '@/components/comment/CommentList';
import TOC from '@/components/post/TOC';
import { Loader2, Calendar, Eye, Folder, User, ArrowLeft, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types'; // 타입 임포트

interface PostDetailClientProps {
  slug: string;
  initialPost: Post; // 🌟 서버에서 넘겨받는 초기 데이터 (필수)
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

  // 1. 게시글 상세 조회
  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPost(slug),
    enabled: !!slug,
    // 🌟 핵심: 서버에서 가져온 데이터를 초기값으로 사용하여 즉시 렌더링 (Hydration)
    initialData: initialPost,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // 🌟 Loading 상태 처리를 제거하거나 조건을 완화합니다.
  // initialData가 있으면 isLoading은 false가 되므로 바로 아래 컨텐츠가 렌더링됩니다.
  if (isPostLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // 에러 처리
  if (error || !post) {
    const { status: errorStatus, message } = getPostErrorInfo(error);
    const errorMessage = message || '게시글을 찾을 수 없습니다.';
    const isAuthError = errorStatus === 401 || errorStatus === 403;

    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="text-[var(--color-text-subtle)]" size={64} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
          {isAuthError ? '접근 권한이 없습니다.' : '게시글을 불러올 수 없습니다.'}
        </h2>
        <p className="mb-6 text-[var(--color-text-muted)]">
          {isAuthError ? '로그인이 필요하거나 비공개 게시글일 수 있습니다.' : errorMessage}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => router.push('/')} className="rounded-lg border border-[var(--color-line)] bg-white/70 px-5 py-2.5 font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-white">메인으로</button>
        </div>
      </div>
    );
  }

  // 백엔드 데이터 사용 (이전글/다음글)
  const prevPost = post.prevPost;
  const nextPost = post.nextPost;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]">
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">목록으로</span>
      </Link>

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,820px)_220px] xl:justify-center xl:gap-16">
        
        <main className="min-w-0">
          <article>
            <header className="mb-10 border-b border-[var(--color-line)] pb-8">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--color-accent)]">
                  <Folder size={14} />
                  <span>{post.categoryName || '미분류'}</span>
                </div>
              </div>
              <h1 className="mb-6 break-keep text-3xl font-bold leading-tight tracking-normal text-[var(--color-text)] md:text-5xl">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  {profile?.imageUrl ? (
                    <Image
                      src={profile.imageUrl}
                      alt="작성자"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-[var(--color-line)] object-cover shadow-sm"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/10"><User size={16} /></div>
                  )}
                  <span className="font-bold text-[var(--color-text)]">{profile?.name || 'Dev Park'}</span>
                </div>
                <div className="flex items-center gap-1.5"><Calendar size={16} />{new Date(post.createdAt).toLocaleDateString('ko-KR')}</div>
                <div className="flex items-center gap-1.5"><Eye size={16} />조회 {post.viewCount.toLocaleString()}</div>
              </div>
            </header>

            <div className="prose prose-lg mb-20 max-w-none prose-headings:font-bold prose-a:text-[var(--color-accent)] prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100">
              <MarkdownRenderer content={post.content || ''} />
            </div>
          </article>

          <nav className="mb-16 grid grid-cols-1 gap-4 border-y border-[var(--color-line)] py-8 md:grid-cols-2">
            {prevPost ? (
              <Link href={`/posts/${prevPost.slug}`} className="group flex w-full flex-col items-start gap-1 rounded-lg border border-transparent bg-white/60 p-5 transition-colors hover:border-[var(--color-line)] hover:bg-white dark:bg-white/10">
                <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-accent)]"><ChevronLeft size={16} /> 이전 글</span>
                <span className="line-clamp-1 w-full text-left font-bold text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]">{prevPost.title}</span>
              </Link>
            ) : <div className="hidden w-full cursor-not-allowed rounded-lg bg-white/40 p-5 opacity-60 dark:bg-white/5 md:block"><span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)]"><ChevronLeft size={16} /> 이전 글 없음</span></div>}

            {nextPost ? (
              <Link href={`/posts/${nextPost.slug}`} className="group flex w-full flex-col items-end gap-1 rounded-lg border border-transparent bg-white/60 p-5 transition-colors hover:border-[var(--color-line)] hover:bg-white dark:bg-white/10">
                <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-accent)]">다음 글 <ChevronRight size={16} /></span>
                <span className="line-clamp-1 w-full text-right font-bold text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]">{nextPost.title}</span>
              </Link>
            ) : <div className="hidden w-full cursor-not-allowed flex-col items-end gap-1 rounded-lg bg-white/40 p-5 opacity-60 dark:bg-white/5 md:flex"><span className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-subtle)]">다음 글 없음 <ChevronRight size={16} /></span></div>}
          </nav>

          <CommentList postSlug={post.slug} />
        </main>

        <aside className="hidden w-[220px] shrink-0 xl:block">
          <div className="sticky top-24">
             <TOC content={post.content || ''} />
          </div>
        </aside>

      </div>
    </div>
  );
}
