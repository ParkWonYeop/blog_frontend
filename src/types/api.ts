export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface PageMeta {
  totalPages: number;
  totalElements: number;
  number?: number;
  last?: boolean;
}

export interface PaginatedResponse<T> extends Partial<PageMeta> {
  content: T[];
  page?: PageMeta;
}
