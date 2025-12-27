import { Post } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

// 🛠️ 헬퍼 함수: 마크다운 문법 제거하고 순수 텍스트만 추출
function getSummary(content?: string) {
  if (!content) return '';
  
  return content
    .replace(/[#*`_~]/g, '')          // 특수문자(#, *, ` 등) 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크에서 텍스트만 남김 [글자](주소) -> 글자
    .replace(/\n/g, ' ')              // 줄바꿈을 공백으로
    .substring(0, 120);               // 120자까지만 자르기
}

export default function PostCard({ post }: { post: Post }) {
  // 요약문 생성
  const summary = getSummary(post.content);

  return (
    <Link href={`/posts/${post.slug}`} className="block group h-full">
      <article className="flex flex-col h-full bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 border border-gray-100">
        
        {/* 상단 카테고리 & 날짜 */}
        <div className="flex items-center justify-between text-xs mb-4">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
            {post.categoryName}
          </span>
          <time className="text-gray-400 font-light">
            {format(new Date(post.createdAt), 'MMM dd, yyyy')}
          </time>
        </div>
        
        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
        
        {/* 요약글 (이제 실제 데이터가 나옵니다) */}
        <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed break-words min-h-[3rem]">
          {summary}
        </p>

        {/* 하단 정보 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <span className="text-xs font-medium text-blue-500 flex items-center gap-1">
            Read more <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
}