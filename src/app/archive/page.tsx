'use client';

import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/api/posts';
import { Post } from '@/types';
import { Loader2, Calendar, Archive, FileText, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PostListResponse } from '@/types';

const getTotalElements = (data?: PostListResponse) => {
  return data?.page?.totalElements ?? data?.totalElements ?? 0;
};

export default function ArchivePage() {
  // 1. 전체 게시글 조회 (최대 1000개)
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => getPosts({ page: 0, size: 1000 }),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // 2. 게시글 그룹화 (연도 -> 월)
  const archiveGroups = useMemo(() => {
    if (!data?.content) return {};

    const groups: { [year: string]: { [month: string]: Post[] } } = {};

    data.content.forEach((post) => {
      const date = new Date(post.createdAt);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // '01', '02' 형식

      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];

      groups[year][month].push(post);
    });

    return groups;
  }, [data]);

  // 3. 연도 내림차순 정렬
  const sortedYears = useMemo(() => {
    return Object.keys(archiveGroups).sort((a, b) => Number(b) - Number(a));
  }, [archiveGroups]);

  // 🛠️ 총 게시글 수 수정 (백엔드 PagedModel 대응)
  // page 정보가 data 안에 직접 있거나, page 객체 안에 있을 수 있음
  const totalPosts = getTotalElements(data);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* 헤더 섹션 */}
      <div className="mb-12 text-center md:text-left border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-3 mb-3">
          <Archive className="text-blue-600" size={32} />
          <span>아카이브</span>
        </h1>
        <p className="text-gray-500">
          지금까지 작성한 <span className="text-blue-600 font-bold">{totalPosts}</span>개의 글이 기록되어 있습니다.
        </p>
      </div>

      {/* 타임라인 컨텐츠 */}
      {sortedYears.length > 0 ? (
        <div className="space-y-12 relative">
          {/* 타임라인 수직선 (좌측 장식) */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 hidden md:block" />

          {sortedYears.map((year) => {
            const months = archiveGroups[year];
            // 월 내림차순 정렬
            const sortedMonths = Object.keys(months).sort((a, b) => Number(b) - Number(a));

            return (
              <div key={year} className="relative">
                {/* 연도 헤더 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 border-4 border-white shadow-sm z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{year}</h2>
                </div>

                {/* 월별 그룹 */}
                <div className="space-y-8 md:pl-12">
                  {sortedMonths.map((month) => {
                    const posts = months[month];
                    // 게시글 날짜 내림차순 정렬
                    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    return (
                      <div key={month} className="group">
                        <h3 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
                          <Calendar size={18} className="text-gray-400" />
                          {month}월
                          <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {posts.length}
                          </span>
                        </h3>

                        <div className="grid gap-3">
                          {sortedPosts.map((post) => (
                            <Link 
                              key={post.id} 
                              href={`/posts/${post.slug}`}
                              className="block bg-white border border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 group/item"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-medium text-gray-800 truncate group-hover/item:text-blue-600 transition-colors">
                                    {post.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                    <span className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                                      {post.categoryName}
                                    </span>
                                    <span>•</span>
                                    <span className="tabular-nums">
                                      {format(new Date(post.createdAt), 'yyyy.MM.dd')}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover/item:text-blue-400 transition-colors" size={20} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">아직 작성된 기록이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
