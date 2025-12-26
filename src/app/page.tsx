// src/app/page.tsx
'use client'; // 클라이언트 컴포넌트 선언 (React Query 사용 위해)

import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/api/posts';
import PostCard from '@/components/post/PostCard';
import { Post } from '@/types';

export default function Home() {
  // 1. React Query로 데이터 가져오기
  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts'], // 캐싱 키
    queryFn: () => getPosts(0, 10), // 0페이지, 10개 조회
  });

  // 2. 로딩 중일 때
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center pt-20">
        <div className="animate-pulse text-gray-400">게시글을 불러오는 중...</div>
      </div>
    );
  }

  // 3. 에러 났을 때
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center pt-20 text-red-500">
        게시글을 불러오지 못했습니다. 서버가 켜져 있는지 확인해주세요.
      </div>
    );
  }

  // 4. 데이터 렌더링
  return (
    <main className="max-w-4xl mx-auto p-6 min-h-screen">
      <header className="mb-10 mt-10">
        <h1 className="text-3xl font-bold text-gray-900">개발자 블로그 🧑‍💻</h1>
        <p className="text-gray-500 mt-2">공부한 내용을 기록하는 공간입니다.</p>
      </header>

      {/* 게시글 목록 그리드 */}
      <section className="grid gap-6 md:grid-cols-2">
        {data?.content.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      {/* 게시글이 하나도 없을 때 */}
      {data?.content.length === 0 && (
        <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg">
          작성된 게시글이 없습니다.
        </div>
      )}
    </main>
  );
}