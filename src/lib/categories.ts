import type { Category } from '@/types';

export type FlatCategory = Category & {
  depth: number;
  parentId: number | null;
};

export type CategoryOption = {
  id: number;
  name: string;
  label: string;
};

export const sortCategoriesById = (categories: Category[] = []) => {
  return [...categories].sort((left, right) => left.id - right.id);
};

export const flattenCategories = (
  categories: Category[] = [],
  depth = 0,
  parentId: number | null = null,
): FlatCategory[] => {
  return sortCategoriesById(categories).flatMap((category) => {
    const resolvedParentId = category.parentId ?? parentId;
    const current = { ...category, parentId: resolvedParentId, depth };

    return [current, ...flattenCategories(category.children || [], depth + 1, category.id)];
  });
};

export const flattenCategoryOptions = (
  categories: Category[] = [],
  depth = 0,
): CategoryOption[] => {
  return categories.flatMap((category) => [
    {
      id: category.id,
      name: category.name,
      label: `${'  '.repeat(depth)}${depth > 0 ? '- ' : ''}${category.name}`,
    },
    ...flattenCategoryOptions(category.children || [], depth + 1),
  ]);
};

export const findCategoryById = (categories: Category[], id: number): Category | null => {
  for (const category of categories) {
    if (category.id === id) return category;

    const found = findCategoryById(category.children || [], id);
    if (found) return found;
  }

  return null;
};

export const findCategoryByName = (categories: Category[], name: string): Category | null => {
  for (const category of categories) {
    if (category.name === name) return category;

    const found = findCategoryByName(category.children || [], name);
    if (found) return found;
  }

  return null;
};

export const countCategories = (categories: Category[] = []): number => {
  return categories.reduce(
    (count, category) => count + 1 + countCategories(category.children || []),
    0,
  );
};
