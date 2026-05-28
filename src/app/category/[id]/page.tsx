'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPostsByCategory } from '@/api/posts'; // 🛠️ 수정된 API 사용
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem';
import PostSearch from '@/components/post/PostSearch'; // 🆕 검색 컴포넌트
import { Loader2, ChevronLeft, ChevronRight, LayoutGrid, List, Search as SearchIcon } from 'lucide-react';
import { clsx } from 'clsx';

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const categoryName = decodeURIComponent(id);
  const apiCategoryName = categoryName === 'uncategorized' ? '미분류' : categoryName;
  
  const isNoticeCategory = apiCategoryName === '공지' || apiCategoryName.toLowerCase() === 'notice';

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState(''); // 🆕 검색어 상태
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (isNoticeCategory || typeof window === 'undefined') return isNoticeCategory ? 'list' : 'grid';

    const savedMode = localStorage.getItem('postViewMode');
    return savedMode === 'list' ? 'list' : 'grid';
  });
  const PAGE_SIZE = 10;
  const activeViewMode = isNoticeCategory ? 'list' : viewMode;

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (!isNoticeCategory) {
      localStorage.setItem('postViewMode', mode);
    }
  };

  // 🆕 검색어가 변경되면 페이지를 0으로 초기화
  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(0);
  };

  const { data: postsData, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: ['posts', 'category', apiCategoryName, page, keyword], // 🔑 쿼리 키에 keyword 추가
    queryFn: () => getPostsByCategory(apiCategoryName, page, PAGE_SIZE, keyword), // 🆕 검색어 전달
    // 🛠️ 수정됨: 검색어가 바뀌면 이전 데이터를 보여주지 않고 로딩 상태로 전환
    // (페이지 이동 시에는 부드럽게 보여주기 위해 유지)
    placeholderData: (previousData, previousQuery) => {
        const prevKeyword = previousQuery?.queryKey[4];
        if (prevKeyword !== keyword) return undefined;
        return previousData;
    },
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

  // 🛠️ 백엔드 PagedModel 구조 대응 (page 필드 내부에 메타데이터가 있을 수 있음)
  const pagingData = postsData?.page || postsData;
  const totalElements = pagingData?.totalElements ?? 0;
  const totalPages = pagingData?.totalPages ?? 0;
  // page.number가 존재하면 계산해서 isLast 판단, 아니면 기존 last 필드 사용
  const isLast = pagingData?.number !== undefined 
    ? (pagingData.number + 1 >= pagingData.totalPages) 
    : (postsData?.last ?? true);

  const handlePrevPage = () => setPage((old) => Math.max(old - 1, 0));
  const handleNextPage = () => {
    if (!isLast) {
      setPage((old) => old + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-baseline gap-2 shrink-0">
          {apiCategoryName} <span className="text-gray-400 text-lg font-normal">글 목록</span>
        </h1>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* 🔍 카테고리 내 검색바 */}
          <PostSearch 
            onSearch={handleSearch} 
            placeholder={`${apiCategoryName} 내 검색`} 
            className="w-full md:w-64"
          />

          {/* 뷰 모드 버튼 */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={clsx(
                "p-2 rounded-md transition-all duration-200",
                activeViewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
              title="카드형 보기"
              aria-label="카드형 보기"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={clsx(
                "p-2 rounded-md transition-all duration-200",
                activeViewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
              title="리스트형 보기"
              aria-label="리스트형 보기"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 결과 안내 (검색 중일 때만 표시) */}
      {keyword && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
          <SearchIcon size={16} className="text-blue-500" />
          <span>
            검색어 <strong>{keyword}</strong> 결과: <strong>{totalElements}</strong>건
          </span>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-400 mb-2">
            {keyword ? `${keyword}에 대한 검색 결과가 없습니다.` : '아직 작성된 글이 없습니다.'}
          </p>
        </div>
      ) : (
        <>
          {activeViewMode === 'grid' ? (
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
              페이지 <span className="text-gray-900 font-bold">{page + 1}</span> {totalPages > 0 && `/ ${totalPages}`}
            </span>

            <button
              onClick={handleNextPage}
              disabled={isLast || isPlaceholderData}
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
