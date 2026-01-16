import type { Category } from '@/types';

interface CategoryOptionsProps {
  categories: Category[];
  selectedId: number | '';
  onSelect: (id: number) => void;
  depth?: number;
}

export default function CategoryOptions({
  categories,
  selectedId,
  onSelect,
  depth = 0,
}: CategoryOptionsProps) {
  return (
    <div className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1'}>
      {categories.map((category) => (
        <div key={category.id}>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--card-bg)] hover:text-[var(--color-text)]"
            style={{ marginLeft: `${depth * 10}px` }}
          >
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedId === category.id}
              onChange={(event) => onSelect(Number(event.target.value))}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className={depth === 0 ? 'font-semibold' : ''}>{category.name}</span>
          </label>
          {category.children?.length > 0 && (
            <CategoryOptions
              categories={category.children}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
