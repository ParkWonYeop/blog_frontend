import Surface from '@/shared/ui/Surface';
import WindowSurface from '@/shared/ui/WindowSurface';
import type { DraftPost } from './types';

interface DraftLoadDialogProps {
  draft: DraftPost;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DraftLoadDialog({
  draft,
  onCancel,
  onConfirm,
}: DraftLoadDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 py-6 backdrop-blur-sm sm:items-center">
      <WindowSurface title="임시저장 불러오기" className="w-full max-w-md" bodyClassName="p-5">
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          현재 작성 중인 내용이 선택한 임시저장 글로 바뀝니다.
        </p>

        <Surface strong className="mt-4 p-4 shadow-none">
          <p className="line-clamp-2 text-sm font-semibold text-[var(--color-text)]">{draft.title}</p>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{draft.savedAt}</p>
        </Surface>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            불러오기
          </button>
        </div>
      </WindowSurface>
    </div>
  );
}
