import { Loader2, Trash2, X } from 'lucide-react';
import { formatKoreanNumericDate } from '@/shared/lib/dates';
import type { Post } from '@/shared/types';

interface PostDeleteDialogProps {
  mode: 'single' | 'bulk';
  posts: Post[];
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PostDeleteDialog({
  mode,
  posts,
  isDeleting,
  onCancel,
  onConfirm,
}: PostDeleteDialogProps) {
  const isBulk = mode === 'bulk';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className={`w-full ${isBulk ? 'max-w-lg' : 'max-w-md'} rounded-xl border border-gray-200 bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-950">
              {isBulk ? '게시글 대량 삭제' : '게시글 삭제'}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {isBulk
                ? `선택한 게시글 ${posts.length.toLocaleString()}개를 삭제합니다. 삭제한 글은 복구할 수 없습니다.`
                : '삭제한 글은 복구할 수 없습니다. 계속 진행할까요?'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label={isBulk ? '대량 삭제 확인 닫기' : '삭제 확인 닫기'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className={`${isBulk ? 'max-h-52 overflow-y-auto' : ''} rounded-lg border border-red-100 bg-red-50`}>
            {posts.map((post) => (
              <div key={post.id} className={`${isBulk ? 'border-b border-red-100 last:border-b-0' : ''} px-4 py-3`}>
                <p className={`${isBulk ? 'line-clamp-1' : 'line-clamp-2'} text-sm font-semibold text-red-950`}>{post.title}</p>
                <p className="mt-1 text-xs text-red-700">
                  {post.categoryName || '미분류'} · {formatKoreanNumericDate(post.createdAt, '-')}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              {isBulk ? '선택 삭제' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
