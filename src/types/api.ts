export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | undefined;
}
