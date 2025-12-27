'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPost, deletePost } from '@/api/posts'; // 🛠️ getPostsByCategory 제거
import { getProfile } from '@/api/profile';
import MarkdownRenderer from '@/components/post/MarkdownRenderer';
import CommentList from '@/components/comment/CommentList';
import TOC from '@/components/post/TOC';
import { Loader2, Calendar, Eye, Folder, User, Edit2, Trash2, ArrowLeft, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface PostDetailClientProps {
  slug: string;
}

export default function PostDetailClient({ slug }: PostDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, _hasHydrated } = useAuthStore();
  const isAdmin = _hasHydrated && role?.includes('ADMIN');

  // 1. 게시글 상세 조회 (이제 여기에 prevPost, nextPost가 포함됨)
  const { data: post, isLoading: isPostLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPost(slug),
    enabled: !!slug,
    retry: 1,
  });

  // 🗑️ 삭제됨: 더 이상 프론트에서 앞뒤 글을 찾기 위해 목록을 조회할 필요가 없음!
  /* const { data: neighborPosts } = useQuery({
    queryKey: ['posts', 'category', post?.categoryName],
    queryFn: () => getPostsByCategory(post!.categoryName, 0, 100),
    enabled: !!post?.categoryName,
    staleTime: 1000 * 60 * 5,
  });
  */

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      alert('게시글이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.push('/');
    },
    onError: (err: any) => {
      alert('삭제 실패: ' + (err.response?.data?.message || err.message));
    },
  });

  if (isPostLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error || !post) {
    const errorStatus = (error as any)?.response?.status;
    const errorMessage = (error as any)?.response?.data?.message || error?.message || '게시글을 찾을 수 없습니다.';
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

  // 🗑️ 삭제됨: 인덱스 계산 로직 제거
  /*
  const currentIndex = neighborPosts?.content.findIndex((p) => p.id === post.id) ?? -1;
  const newerPost = ...
  const olderPost = ...
  */

  // 🆕 백엔드 데이터 직접 사용
  // 보통 '이전 글'은 과거 글(prev), '다음 글'은 최신 글(next)입니다.
  // 백엔드 구현에 따라 prevPost/nextPost 위치가 반대일 수 있으니 확인 후 위치만 바꿔주세요.
  const prevPost = post.prevPost; // 이전 글 (왼쪽 버튼)
  const nextPost = post.nextPost; // 다음 글 (오른쪽 버튼)

  const handleDelete = () => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까? 복구할 수 없습니다.')) {
      deleteMutation.mutate(post.id);
    }
  };

  const handleEdit = () => {
    router.push(`/write?slug=${post.slug}`);
  };

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
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={18} /></button>
                    <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                  </div>
                )}
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

          {/* 🛠️ 네비게이션 영역 수정: prevPost / nextPost 직접 사용 */}
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