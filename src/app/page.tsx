'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPosts } from '@/api/posts';
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem';
// PostSearch 컴포넌트 제거 (사이드바로 이동)
import { Post } from '@/types';
import { Loader2, Megaphone, Flame, Clock, ChevronRight, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 쿼리 스트링에서 검색어 가져오기
  const keyword = searchParams.get('keyword') || '';

  // 1. 공지사항 조회
  const { data: noticesData, isLoading: isNoticesLoading } = useQuery({
    queryKey: ['posts', 'notices'],
    queryFn: () => getPosts({ category: '공지', size: 3, sort: 'createdAt,desc' }),
  });

  // 2. 최신 게시글 조회
  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['posts', 'latest'],
    queryFn: () => getPosts({ size: 10, sort: 'createdAt,desc' }),
  });

  // 3. 인기 게시글 조회
  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['posts', 'popular'],
    queryFn: () => getPosts({ size: 10, sort: 'viewCount,desc' }),
  });

  // 4. 검색 결과 조회
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['posts', 'search', keyword],
    queryFn: () => getPosts({ keyword, size: 20 }),
    enabled: !!keyword,
  });

  if (isNoticesLoading || isLatestLoading || isPopularLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const filterPosts = (posts: Post[] | undefined, limit: number) => {
    if (!posts) return [];
    return posts
      .filter((post) => post.categoryName !== '공지' && post.categoryName.toLowerCase() !== 'notice')
      .slice(0, limit);
  };

  const notices = noticesData?.content || [];
  const latestPosts = filterPosts(latestData?.content, 3);
  const popularPosts = filterPosts(popularData?.content, 3);
  
  const searchResults = searchData?.content || [];
  const searchMeta = (searchData as any)?.page || searchData;
  const searchTotalElements = searchMeta?.totalElements ?? 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      
      {/* 🅰️ 검색 모드: 검색어가 있을 때 표시 */}
      {keyword ? (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <SearchIcon className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              "{keyword}" 검색 결과 <span className="text-blue-600 text-lg ml-1">{searchTotalElements}</span>건
            </h2>
          </div>

          {isSearchLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col gap-0 border-t border-gray-100">
              {searchResults.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
        </section>
      ) : (
        /* 🅱️ 대시보드 모드: 검색어가 없을 때 기존 화면 표시 */
        <div className="space-y-16 animate-in fade-in duration-500">
          {/* 공지사항 섹션 */}
          {notices.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Megaphone className="text-red-500" size={20} />
                <h2 className="text-xl font-bold text-gray-800">공지사항</h2>
              </div>
              <div className="flex flex-col gap-2">
                {notices.map((post) => (
                  <PostListItem key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* 최신 포스트 섹션 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                <h2 className="text-xl font-bold text-gray-800">최신 포스트</h2>
              </div>
              <Link href="/archive" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                전체보기 <ChevronRight size={14} />
              </Link>
            </div>
            
            {latestPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <div key={post.id} className="h-full">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-400">
                아직 작성된 글이 없습니다.
              </div>
            )}
          </section>

          {/* 인기 포스트 섹션 */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="text-orange-500" size={20} />
              <h2 className="text-xl font-bold text-gray-800">인기 포스트</h2>
            </div>

            {popularPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularPosts.map((post) => (
                  <div key={post.id} className="h-full">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-400">
                아직 인기 글이 집계되지 않았습니다.
              </div>
            )}
          </section>

          {/* 하단 아카이브 링크 */}
          {/* <div className="pt-8 pb-4 text-center">
            <Link 
              href="/archive" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              모든 글 보러가기 <ChevronRight size={16} />
            </Link>
          </div> */}
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-500" size={40} /></div>}>
      <HomeContent />
    </Suspense>
  );
}