import type { PageMeta } from '@/types';

export const EMPTY_PAGE_META: Readonly<PageMeta> = {
  totalPages: 0,
  totalElements: 0,
  number: 0,
  last: true,
};

type PaginatedData = Partial<PageMeta> & {
  page?: Partial<PageMeta>;
};

export const getPageMeta = (data?: PaginatedData | null): PageMeta => {
  if (!data) return { ...EMPTY_PAGE_META };

  return {
    totalPages: data.page?.totalPages ?? data.totalPages ?? 0,
    totalElements: data.page?.totalElements ?? data.totalElements ?? 0,
    number: data.page?.number ?? data.number ?? 0,
    last: data.page?.last ?? data.last,
  };
};
