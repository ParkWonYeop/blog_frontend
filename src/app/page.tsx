'use client';

import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/api/posts';
import PostCard from '@/components/post/PostCard';
import PostListItem from '@/components/post/PostListItem';
import { Post } from '@/types';
import { Loader2, Megaphone, Flame, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  // 1. 공지사항 조회 (최대 3개, 최신순)
  const { data: noticesData, isLoading: isNoticesLoading } = useQuery({
    queryKey: ['posts', 'notices'],
    queryFn: () => getPosts({ category: '공지', size: 3, sort: 'createdAt,desc' }),
  });

  // 2. 최신 게시글 조회 (넉넉히 10개 가져와서 공지 제외하고 3개만 사용)
  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['posts', 'latest'],
    queryFn: () => getPosts({ size: 10, sort: 'createdAt,desc' }),
  });

  // 3. 인기 게시글 조회 (조회수순, 넉넉히 10개 가져와서 공지 제외하고 3개만 사용)
  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['posts', 'popular'],
    queryFn: () => getPosts({ size: 10, sort: 'viewCount,desc' }),
  });

  // 로딩 상태 처리
  if (isNoticesLoading || isLatestLoading || isPopularLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // 데이터 필터링 헬퍼 함수
  const filterPosts = (posts: Post[] | undefined, limit: number) => {
    if (!posts) return [];
    return posts
      .filter((post) => post.categoryName !== '공지' && post.categoryName.toLowerCase() !== 'notice')
      .slice(0, limit);
  };

  const notices = noticesData?.content || [];
  // 5개 -> 3개로 수정
  const latestPosts = filterPosts(latestData?.content, 3);
  const popularPosts = filterPosts(popularData?.content, 3);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-16">
      
      {/* 📢 1. 공지사항 섹션 (리스트 형태) */}
      {notices.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      {/* 🕒 2. 최신 게시글 섹션 (카드 형태) */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
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
             {/* 첫 번째 글은 강조를 위해 크게 보여줄 수도 있지만, 여기선 균일하게 배치 */}
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

      {/* 🔥 3. 인기 게시글 섹션 (카드 형태) */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
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

      {/* 하단 여백 및 아카이브 링크 배너 */}
      <div className="pt-8 pb-4 text-center">
        <Link 
          href="/archive" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          모든 글 보러가기 <ChevronRight size={16} />
        </Link>
      </div>

    </main>
  );
}