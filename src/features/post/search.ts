export const SEARCH_PAGE_SIZE = 20;

export function parseSearchPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 && page <= 2_147_483_647 ? page : 1;
}

export function getSearchPageHref(keyword: string, page: number): string {
  const params = new URLSearchParams({ keyword });
  if (page > 1) params.set('page', String(page));
  return `/?${params.toString()}`;
}
