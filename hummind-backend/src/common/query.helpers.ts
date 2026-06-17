export type SortDirection = 'asc' | 'desc';

export type OrderByClause<F extends string = string> = Partial<
  Record<F, SortDirection>
>;

export function parseSort<F extends string = string>(
  sort: string | undefined,
  defaultField: F = 'createdAt' as F,
  defaultDirection: SortDirection = 'desc',
): OrderByClause<F>[] {
  if (!sort) {
    return [{ [defaultField]: defaultDirection } as OrderByClause<F>];
  }

  return sort.split(',').map((segment) => {
    const [rawField, rawDir] = segment.split(':');
    const field = rawField.trim() as F;
    const direction: SortDirection =
      rawDir?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return { [field]: direction } as OrderByClause<F>;
  });
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginationOutput {
  skip: number;
  take: number;
}

export function paginate(input: PaginationInput): PaginationOutput {
  const page = Math.max(1, input.page);
  const pageSize = Math.max(1, input.pageSize);
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  return {
    data,
    meta: { page: input.page, pageSize: input.pageSize, total },
  };
}
