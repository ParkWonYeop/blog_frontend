'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/api/posts';
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem'; // 새로 만든 컴포넌트 import
import { Post } from '@/types';
import { ChevronLeft, ChevronRight, Loader2, LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';

export default function Home() {
  const [page, setPage] = useState(0);
  // 뷰 모드 상태: 'grid' 또는 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const PAGE_SIZE = 10;

  // 💡 사용자 선호 모드를 로컬 스토리지에서 불러오기 (UX 향상)
  useEffect(() => {
    const savedMode = localStorage.getItem('postViewMode') as 'grid' | 'list';
    if (savedMode) setViewMode(savedMode);
  }, []);

  // 모드 변경 시 로컬 스토리지에 저장
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('postViewMode', mode);
  };

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts({ page, size: PAGE_SIZE }), 
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center pt-20 text-red-500">
        게시글을 불러오지 못했습니다. 서버가 켜져 있는지 확인해주세요.
      </div>
    );
  }

  const handlePrevPage = () => {
    setPage((old) => Math.max(old - 1, 0));
  };

  const handleNextPage = () => {
    if (!data?.last) {
      setPage((old) => old + 1);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 min-h-screen">
      {/* 헤더 영역 (제목 + 뷰 모드 버튼) */}
      <header className="mb-8 mt-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">전체 게시글</h1>
        
        {/* 뷰 모드 토글 버튼 */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={clsx(
              "p-2 rounded-md transition-all duration-200",
              viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
            title="카드형 보기"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={clsx(
              "p-2 rounded-md transition-all duration-200",
              viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
            title="리스트형 보기"
          >
            <List size={18} />
          </button>
        </div>
      </header>

      {/* 게시글 목록 (조건부 렌더링) */}
      {viewMode === 'grid' ? (
        // 그리드 뷰
        <section className="grid gap-6 md:grid-cols-2">
          {data?.content.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        // 리스트 뷰
        <section className="flex flex-col border-t border-gray-100">
          {data?.content.map((post: Post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </section>
      )}

      {data?.content.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg">
          작성된 게시글이 없습니다.
        </div>
      )}

      {data && data.content.length > 0 && (
        <div className="flex justify-center items-center gap-6 mt-12 mb-8">
          <button
            onClick={handlePrevPage}
            disabled={page === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
            aria-label="이전 페이지"
          >
            <ChevronLeft size={24} />
          </button>
          
          <span className="text-sm font-medium text-gray-600">
             Page <span className="text-gray-900 font-bold">{page + 1}</span> {data.totalPages > 0 && `/ ${data.totalPages}`}
          </span>

          <button
            onClick={handleNextPage}
            disabled={data.last || isPlaceholderData}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
            aria-label="다음 페이지"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </main>
  );
}