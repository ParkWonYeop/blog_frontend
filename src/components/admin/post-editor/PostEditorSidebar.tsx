import type { ChangeEvent } from 'react';
import { CheckCircle2, Clock, Folder, Image as ImageIcon, Tags, Trash2, UploadCloud } from 'lucide-react';
import Surface from '@/components/ui/Surface';
import type { Category } from '@/types';
import CategoryOptions from './CategoryOptions';
import type { DraftPost } from './types';

interface PostEditorSidebarProps {
  contentLength: number;
  wordCount: number;
  readingMinutes: number;
  selectedCategoryName: string;
  categories: Category[];
  categoryId: number | '';
  onCategoryChange: (id: number) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  drafts: DraftPost[];
  showDraftList: boolean;
  onToggleDraftList: () => void;
  onLoadDraft: (draft: DraftPost) => void;
  onDeleteDraft: (id: number) => void;
}

export default function PostEditorSidebar({
  contentLength,
  wordCount,
  readingMinutes,
  selectedCategoryName,
  categories,
  categoryId,
  onCategoryChange,
  tags,
  onTagsChange,
  isUploading,
  onFileChange,
  drafts,
  showDraftList,
  onToggleDraftList,
  onLoadDraft,
  onDeleteDraft,
}: PostEditorSidebarProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <Surface strong className="p-4 shadow-none">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          <CheckCircle2 size={17} className="text-[var(--color-accent)]" />
          발행 상태
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            [contentLength.toLocaleString(), '글자'],
            [wordCount.toLocaleString(), '단어'],
            [readingMinutes, '분'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-card)]">
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{value}</p>
              <p className="text-[10px] font-semibold text-[var(--color-text-subtle)]">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
          카테고리: <span className="font-semibold text-[var(--color-text)]">{selectedCategoryName}</span>
        </p>
      </Surface>

      <Surface strong className="p-4 shadow-none">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          <Folder size={17} />
          카테고리
        </h2>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow-card)]">
          {categories.length > 0 ? (
            <CategoryOptions categories={categories} selectedId={categoryId} onSelect={onCategoryChange} />
          ) : (
            <div className="flex min-h-24 items-center justify-center text-sm text-[var(--color-text-subtle)]">
              불러오는 중...
            </div>
          )}
        </div>
      </Surface>

      <Surface strong className="p-4 shadow-none">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          <Tags size={17} />
          태그
        </h2>
        <input
          type="text"
          value={tags}
          onChange={(event) => onTagsChange(event.target.value)}
          placeholder="react, nextjs, essay"
          className="w-full rounded-lg border border-[var(--control-border)] bg-[var(--color-control)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)]"
        />
        <p className="mt-2 text-xs text-[var(--color-text-subtle)]">쉼표로 구분해서 입력하세요.</p>
      </Surface>

      <Surface strong className="p-4 shadow-none">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          <ImageIcon size={17} />
          이미지
        </h2>
        <label className={`flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-center shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)] hover:bg-[var(--card-bg-strong)] ${isUploading ? 'cursor-wait opacity-60' : ''}`}>
          <UploadCloud className="mb-2 h-7 w-7 text-[var(--color-text-subtle)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {isUploading ? '업로드 중...' : '이미지 선택'}
          </span>
          <span className="mt-1 text-xs leading-5 text-[var(--color-text-subtle)]">
            파일 선택 또는 에디터에 붙여넣기
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={isUploading} />
        </label>
      </Surface>

      <Surface strong className="overflow-hidden shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <Clock size={17} />
            임시저장
          </h2>
          <button
            type="button"
            onClick={onToggleDraftList}
            className="rounded-full border border-[var(--control-border)] bg-[var(--color-control)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-muted)] transition hover:bg-[var(--card-bg-strong)] hover:text-[var(--color-text)]"
          >
            {drafts.length}/10
          </button>
        </div>

        {showDraftList ? (
          <div className="max-h-72 overflow-y-auto p-2">
            {drafts.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-sm text-[var(--color-text-subtle)]">
                저장된 글이 없습니다.
              </div>
            ) : (
              <ul className="space-y-1">
                {drafts.map((draft) => (
                  <li key={draft.id} className="group rounded-lg px-3 py-2 transition hover:bg-[var(--card-bg)]">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => onLoadDraft(draft)} className="min-w-0 flex-1 text-left">
                        <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{draft.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{draft.savedAt}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDraft(draft.id)}
                        className="rounded p-1.5 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-danger-soft)] hover:text-red-500"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="p-4 text-xs leading-5 text-[var(--color-text-muted)]">
            임시저장 목록은 필요할 때만 펼쳐 볼 수 있습니다.
          </div>
        )}
      </Surface>
    </aside>
  );
}
