'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Folder, FolderOpen, FolderPlus, FolderTree, Loader2, Save, Trash2 } from 'lucide-react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/api/category';
import { Category, CategoryUpdateRequest } from '@/types';
import { clsx } from 'clsx';

const ROOT_PARENT = 'root';

type FlatCategory = Category & {
  depth: number;
  parentId: number | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return `${fallback}: ${response.data.message}`;
  }

  if (error instanceof Error) return `${fallback}: ${error.message}`;

  return fallback;
};

const sortCategories = (categories: Category[] = []) => {
  return [...categories].sort((a, b) => a.id - b.id);
};

const flattenCategories = (
  categories: Category[] = [],
  depth = 0,
  parentId: number | null = null,
): FlatCategory[] => {
  return sortCategories(categories).flatMap((category) => {
    const resolvedParentId = category.parentId ?? parentId;
    const current: FlatCategory = {
      ...category,
      parentId: resolvedParentId,
      depth,
    };

    return [
      current,
      ...flattenCategories(category.children || [], depth + 1, category.id),
    ];
  });
};

const collectDescendantIds = (category: Category): Set<number> => {
  const ids = new Set<number>([category.id]);

  for (const child of category.children || []) {
    for (const id of collectDescendantIds(child)) {
      ids.add(id);
    }
  }

  return ids;
};

const parentValueToId = (value: string): number | null => {
  return value === ROOT_PARENT ? null : Number(value);
};

const parentIdToValue = (parentId?: number | null) => {
  return parentId == null ? ROOT_PARENT : String(parentId);
};

function ParentSelect({
  value,
  onChange,
  categories,
  disabledIds = new Set<number>(),
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: FlatCategory[];
  disabledIds?: Set<number>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
    >
      <option value={ROOT_PARENT}>최상위 카테고리</option>
      {categories.map((category) => (
        <option
          key={category.id}
          value={category.id}
          disabled={disabledIds.has(category.id)}
        >
          {`${'  '.repeat(category.depth)}${category.depth > 0 ? '- ' : ''}${category.name}`}
        </option>
      ))}
    </select>
  );
}

function CategoryTree({
  categories,
  selectedId,
  onSelect,
  depth = 0,
}: {
  categories: Category[];
  selectedId: number | null;
  onSelect: (category: Category) => void;
  depth?: number;
}) {
  return (
    <div className="space-y-1">
      {sortCategories(categories).map((category) => {
        const isSelected = selectedId === category.id;
        const hasChildren = category.children?.length > 0;

        return (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category)}
              className={clsx(
                'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50',
              )}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {hasChildren ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span className="truncate font-medium">{category.name}</span>
              </span>
              <span className="shrink-0 text-xs text-gray-400">#{category.id}</span>
            </button>

            {hasChildren && (
              <CategoryTree
                categories={category.children}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectedCategoryEditor({
  category,
  flatCategories,
  onUpdate,
  onDelete,
  isSaving,
  isDeleting,
}: {
  category: FlatCategory;
  flatCategories: FlatCategory[];
  onUpdate: (id: number, data: CategoryUpdateRequest) => void;
  onDelete: (id: number) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [parentValue, setParentValue] = useState(parentIdToValue(category.parentId));
  const [deleteArmed, setDeleteArmed] = useState(false);
  const disabledParentIds = useMemo(() => collectDescendantIds(category), [category]);
  const isBusy = isSaving || isDeleting;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    onUpdate(category.id, {
      name: trimmedName,
      parentId: parentValueToId(parentValue),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">선택한 카테고리</h3>
          <p className="mt-1 text-xs text-gray-500">이름 변경과 부모 카테고리 이동을 여기서 처리합니다.</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-500">
          #{category.id}
        </span>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-bold text-gray-500">카테고리 이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isBusy}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-gray-500">상위 카테고리</span>
          <div className="mt-1">
            <ParentSelect
              value={parentValue}
              onChange={setParentValue}
              categories={flatCategories}
              disabledIds={disabledParentIds}
              disabled={isBusy}
            />
          </div>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {!deleteArmed ? (
            <button
              type="button"
              onClick={() => setDeleteArmed(true)}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              삭제
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                삭제 확인
              </button>
              <button
                type="button"
                onClick={() => setDeleteArmed(false)}
                disabled={isBusy}
                className="rounded-full px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-white"
              >
                취소
              </button>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
          변경 저장
        </button>
      </div>
    </form>
  );
}

export default function AdminCategoryPanel() {
  const queryClient = useQueryClient();
  const [createName, setCreateName] = useState('');
  const [createParentValue, setCreateParentValue] = useState(ROOT_PARENT);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    retry: 0,
  });

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const selectedCategory = flatCategories.find((category) => category.id === selectedId);

  const invalidateCategoryData = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidateCategoryData();
      setCreateName('');
      setCreateParentValue(ROOT_PARENT);
      toast.success('카테고리가 생성되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '카테고리 생성 실패')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdateRequest }) => updateCategory(id, data),
    onSuccess: () => {
      invalidateCategoryData();
      toast.success('카테고리가 수정되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '카테고리 수정 실패')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      invalidateCategoryData();
      setSelectedId(null);
      toast.success('카테고리가 삭제되었습니다.');
    },
    onError: (error) => toast.error(getErrorMessage(error, '카테고리 삭제 실패')),
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = createName.trim();
    if (!trimmedName) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    createMutation.mutate({
      name: trimmedName,
      parentId: parentValueToId(createParentValue),
    });
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
            <FolderTree size={19} />
            카테고리 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500">공개 사이드바의 카테고리 구조를 관리자 화면에서 정리합니다.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-900">카테고리 트리</h3>
            <span className="text-xs text-gray-400">{flatCategories.length.toLocaleString()}개</span>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg bg-gray-50">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : categories.length > 0 ? (
            <CategoryTree categories={categories} selectedId={selectedId} onSelect={(category) => setSelectedId(category.id)} />
          ) : (
            <div className="rounded-lg bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
              아직 카테고리가 없습니다.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <form onSubmit={handleCreate} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <FolderPlus size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">새 카테고리 추가</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="카테고리 이름"
                disabled={createMutation.isPending}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
              <ParentSelect
                value={createParentValue}
                onChange={setCreateParentValue}
                categories={flatCategories}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {createMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <FolderPlus size={15} />}
                추가
              </button>
            </div>
          </form>

          {selectedCategory ? (
            <SelectedCategoryEditor
              key={`${selectedCategory.id}-${selectedCategory.name}-${selectedCategory.parentId}`}
              category={selectedCategory}
              flatCategories={flatCategories}
              onUpdate={(id, data) => updateMutation.mutate({ id, data })}
              onDelete={(id) => deleteMutation.mutate(id)}
              isSaving={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
              <p className="text-sm font-semibold text-gray-700">수정할 카테고리를 선택하세요.</p>
              <p className="mt-2 text-sm text-gray-400">왼쪽 트리에서 항목을 선택하면 이름과 위치를 변경할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
