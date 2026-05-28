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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="text-gray-300" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isAuthError ? '접근 권한이 없습니다.' : '게시글을 불러올 수 없습니다.'}
        </h2>
        <p className="text-gray-500 mb-6">
          {isAuthError ? '로그인이 필요하거나 비공개 게시글일 수 있습니다.' : errorMessage}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">메인으로</button>
        </div>
      </div>
    );
  }

  // 백엔드 데이터 사용 (이전글/다음글)
  const prevPost = post.prevPost;
  const nextPost = post.nextPost;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12">
      <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">목록으로</span>
      </Link>

      <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 relative">
        
        <main className="min-w-0 xl:flex-1">
          <article>
            <header className="mb-10 border-b border-gray-100 pb-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  <Folder size={14} />
                  <span>{post.categoryName || 'Uncategorized'}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight break-keep">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {profile?.imageUrl ? <img src={profile.imageUrl} alt="Author" className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm" /> : <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><User size={16} /></div>}
                  <span className="font-bold text-gray-800">{profile?.name || 'Dev Park'}</span>
                </div>
                <div className="flex items-center gap-1.5"><Calendar size={16} />{new Date(post.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5"><Eye size={16} />{post.viewCount} views</div>
              </div>
            </header>

            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-2xl prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 mb-20">
              <MarkdownRenderer content={post.content || ''} />
            </div>
          </article>

          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-gray-100 py-8 mb-16">
            {prevPost ? (
              <Link href={`/posts/${prevPost.slug}`} className="group flex flex-col items-start gap-1 p-5 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors w-full border border-transparent hover:border-blue-100">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors"><ChevronLeft size={16} /> 이전 글</span>
                <span className="font-bold text-gray-700 group-hover:text-blue-700 transition-colors line-clamp-1 w-full text-left">{prevPost.title}</span>
              </Link>
            ) : <div className="hidden md:block p-5 rounded-2xl bg-gray-50/50 w-full opacity-50 cursor-not-allowed"><span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1"><ChevronLeft size={16} /> 이전 글 없음</span></div>}

            {nextPost ? (
              <Link href={`/posts/${nextPost.slug}`} className="group flex flex-col items-end gap-1 p-5 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors w-full border border-transparent hover:border-blue-100">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">다음 글 <ChevronRight size={16} /></span>
                <span className="font-bold text-gray-700 group-hover:text-blue-700 transition-colors line-clamp-1 w-full text-right">{nextPost.title}</span>
              </Link>
            ) : <div className="hidden md:flex flex-col items-end gap-1 p-5 rounded-2xl bg-gray-50/50 w-full opacity-50 cursor-not-allowed"><span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1">다음 글 없음 <ChevronRight size={16} /></span></div>}
          </nav>

          <CommentList postSlug={post.slug} />
        </main>

        <aside className="hidden 2xl:block w-[220px] shrink-0">
          <div className="sticky top-24">
             <TOC content={post.content || ''} />
          </div>
        </aside>

      </div>
    </div>
  );
}
