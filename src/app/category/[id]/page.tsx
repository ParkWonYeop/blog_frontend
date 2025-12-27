'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPostsByCategory } from '@/api/posts';
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem'; 
import { Loader2, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { notFound } from 'next/navigation';
import { clsx } from 'clsx';

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryName = decodeURIComponent(id);
  const apiCategoryName = categoryName === 'uncategorized' ? '미분류' : categoryName;
  
  // 📢 공지 카테고리인지 판별
  const isNoticeCategory = apiCategoryName === '공지' || apiCategoryName.toLowerCase() === 'notice';

  const [page, setPage] = useState(0);
  
  // 공지사항이면 기본값을 'list'로 설정
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const PAGE_SIZE = 10;

  useEffect(() => {
    // 📢 공지 카테고리는 강제로 리스트 뷰 적용
    if (isNoticeCategory) {
      setViewMode('list');
      return;
    }

    // 그 외에는 로컬 스토리지 설정 따름
    const savedMode = localStorage.getItem('postViewMode') as 'grid' | 'list';
    if (savedMode) setViewMode(savedMode);
  }, [isNoticeCategory]);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    // 공지 카테고리가 아닐 때만 사용자 설정을 저장 (공지는 뷰 강제이므로 저장 안 함)
    if (!isNoticeCategory) {
      localStorage.setItem('postViewMode', mode);
    }
  };

  const { data: postsData, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: ['posts', 'category', apiCategoryName, page],
    queryFn: () => getPostsByCategory(apiCategoryName, page, PAGE_SIZE),
    placeholderData: (previousData) => previousData,
  });

  if (isLoading || (postsData === undefined && !error)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        게시글을 불러오는 중 오류가 발생했습니다.<br/>
        <span className="text-sm text-gray-400">카테고리 이름을 확인해주세요.</span>
      </div>
    );
  }

  const posts = postsData?.content || [];

  const handlePrevPage = () => setPage((old) => Math.max(old - 1, 0));
  const handleNextPage = () => {
    if (!postsData?.last) {
      setPage((old) => old + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 영역 수정 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-baseline gap-2">
          {apiCategoryName} <span className="text-gray-400 text-lg font-normal">글 목록</span>
        </h1>

        {/* 뷰 모드 버튼 */}
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
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-400 mb-2">아직 작성된 글이 없습니다.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col border-t border-gray-100">
              {posts.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          )}

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
              Page <span className="text-gray-900 font-bold">{page + 1}</span> {postsData && postsData.totalPages > 0 && `/ ${postsData.totalPages}`}
            </span>

            <button
              onClick={handleNextPage}
              disabled={postsData?.last || isPlaceholderData}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
              aria-label="다음 페이지"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}