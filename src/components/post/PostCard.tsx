import { Post } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { clsx } from 'clsx'; // 🎨 스타일 조건부 적용을 위해 clsx 사용

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
  
  // 📢 공지 카테고리 여부 확인 (한글 '공지' 또는 영문 'Notice' 대소문자 무관)
  const isNotice = post.categoryName === '공지' || post.categoryName.toLowerCase() === 'notice';

  return (
    <Link href={`/posts/${post.slug}`} className="block group h-full">
      <article className={clsx(
        "flex flex-col h-full bg-white rounded-2xl p-6 transition-all duration-300 border",
        // 공지글이면 테두리에 살짝 붉은 기운을 줌
        isNotice 
          ? "border-red-100 shadow-[0_2px_8px_rgba(239,68,68,0.08)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)]" 
          : "border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        "hover:-translate-y-1"
      )}>
        
        {/* 상단 카테고리 & 날짜 */}
        <div className="flex items-center justify-between text-xs mb-4">
          <span className={clsx(
            "px-2.5 py-1 rounded-md font-medium transition-colors",
            isNotice 
              ? "bg-red-50 text-red-600 font-bold border border-red-100" // 🔴 공지 스타일
              : "bg-slate-100 text-slate-600" // 기본 스타일
          )}>
            {isNotice && '📢 '}{post.categoryName}
          </span>
          <time className="text-gray-400 font-light">
            {format(new Date(post.createdAt), 'MMM dd, yyyy')}
          </time>
        </div>
        
        {/* 제목 */}
        <h2 className={clsx(
          "text-xl font-bold mb-3 transition-colors line-clamp-2",
          isNotice ? "text-gray-900 group-hover:text-red-600" : "text-gray-800 group-hover:text-blue-600"
        )}>
          {post.title}
        </h2>
        
        {/* 요약글 */}
        <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed break-words min-h-[3rem]">
          {summary}
        </p>

        {/* 하단 정보 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <span className={clsx(
            "text-xs font-medium flex items-center gap-1",
            isNotice ? "text-red-500" : "text-blue-500"
          )}>
            Read more <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
}