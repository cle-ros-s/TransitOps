import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface SortParams {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  [key: string]: string | undefined;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE),
  );
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function parseSort(
  query: Record<string, unknown>,
  allowedFields: string[],
  defaultField = 'createdAt',
): SortParams {
  const rawSortBy = String(query.sortBy || defaultField);
  const sortBy = allowedFields.includes(rawSortBy) ? rawSortBy : defaultField;
  const sortDir = (query.sortDir === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  return { sortBy, sortDir };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
