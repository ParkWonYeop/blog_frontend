// src/app/posts/[slug]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getPostBySlug } from '@/api/posts';
import MarkdownRenderer from '@/components/post/MarkdownRenderer';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User } from 'lucide-react';

export default function PostDetailPage() {
  const { slug } = useParams(); // URL에서 slug 가져오기
  const router = useRouter();

  // 데이터 조회
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPostBySlug(slug as string),
    enabled: !!slug, // slug가 있을 때만 실행
  });

  if (isLoading) return <div className="text-center py-20 animate-pulse">글을 불러오는 중... ⏳</div>;
  
  if (isError || !post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">글을 찾을 수 없습니다. 😭</h2>
        <button onClick={() => router.back()} className="text-blue-500 hover:underline">
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto pb-20">
      {/* 1. 뒤로가기 버튼 */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        목록으로
      </button>

      {/* 2. 헤더 영역 (카테고리, 제목, 날짜) */}
      <header className="mb-10 text-center">
        <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
          {post.categoryName}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>Dev Park</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <time>{format(new Date(post.createdAt), 'yyyy년 MM월 dd일')}</time>
          </div>
        </div>
      </header>
      
      {/* 구분선 */}
      <hr className="border-gray-200 my-10" />

      {/* 3. 본문 영역 (마크다운) */}
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
        {/* 본문이 있으면 렌더링, 없으면 안내 문구 */}
        {post.content ? (
          <MarkdownRenderer content={post.content} />
        ) : (
          <p className="text-gray-400 italic">작성된 본문 내용이 없습니다.</p>
        )}
      </div>

      {/* 4. 하단 댓글 영역 (추후 구현 예정 자리) */}
      <div className="mt-16">
        <h3 className="text-xl font-bold mb-6">댓글</h3>
        <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400">
          댓글 기능은 곧 추가될 예정입니다! 🚀
        </div>
      </div>
    </article>
  );
}