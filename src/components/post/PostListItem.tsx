import Link from 'next/link';
import { Post } from '@/types';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface PostListItemProps {
  post: Post;
}

export default function PostListItem({ post }: PostListItemProps) {
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <div className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* 카테고리 라벨 (작은 화면에선 숨김 처리 가능) */}
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
              {post.categoryName}
            </span>

            {/* 제목 */}
            <h3 className="text-base font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
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