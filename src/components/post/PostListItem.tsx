import Link from 'next/link';
import { Post } from '@/types';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface PostListItemProps {
  post: Post;
}

export default function PostListItem({ post }: PostListItemProps) {
  // 📢 공지 카테고리 여부 확인
  const isNotice = post.categoryName === '공지' || post.categoryName.toLowerCase() === 'notice';

  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <div className={clsx(
        "flex items-center justify-between py-4 border-b px-4 -mx-4 rounded-lg transition-colors",
        isNotice 
          ? "border-red-50 hover:bg-red-50/30" // 공지일 때 배경색 살짝 붉게
          : "border-gray-100 hover:bg-gray-50"
      )}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* 카테고리 라벨 */}
            <span className={clsx(
              "hidden sm:inline-block px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
              isNotice 
                ? "bg-red-100 text-red-600 font-bold" // 🔴 공지 스타일 강조
                : "bg-slate-100 text-slate-600"
            )}>
              {isNotice && '📢 '}{post.categoryName}
            </span>

            {/* 제목 */}
            <h3 className={clsx(
              "text-base font-medium truncate transition-colors",
              isNotice 
                ? "text-gray-900 group-hover:text-red-600 font-semibold" 
                : "text-gray-800 group-hover:text-blue-600"
            )}>
              {post.title}
            </h3>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-400 ml-4 whitespace-nowrap">
          {/* 조회수 */}
          <div className="hidden sm:flex items-center gap-1.5" title="조회수">
            <Eye size={14} />
            <span className="text-xs">{post.viewCount}</span>
          </div>

          {/* 날짜 */}
          <time className="font-light tabular-nums text-xs sm:text-sm">
            {format(new Date(post.createdAt), 'yyyy.MM.dd')}
          </time>
        </div>
      </div>
    </Link>
  );
}