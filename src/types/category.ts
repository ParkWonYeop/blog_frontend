export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  children: Category[];
}

export interface CategoryCreateRequest {
  name: string;
  parentId?: number | null;
}

export interface CategoryUpdateRequest {
  name: string;
  parentId?: number | null;
}
