/**
 * Pagination Types
 *
 * Pagination request/response primitives for list endpoints.
 * Contract Evidence: Standard API pagination pattern from OpenAPI
 *
 * @module core/domain/api/pagination.types
 */

/**
 * Pagination parameters for list requests.
 * R11-AC1: Includes page?, per_page?
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  per_page?: number;
}

/**
 * Pagination metadata from response.
 * R11-AC3: All fields optional for forward-compatibility
 */
export interface PaginationMeta {
  current_page?: number;
  per_page?: number;
  total_pages?: number;
  total_items?: number;
}

/**
 * Paginated response wrapper.
 * R11-AC2: Includes data: T[], pagination metadata
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Default pagination values.
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  per_page: 20,
};

/**
 * Create pagination params with defaults.
 */
export function createPaginationParams(
  partial?: Partial<PaginationParams>
): PaginationParams {
  return {
    page: partial?.page ?? DEFAULT_PAGINATION.page,
    per_page: partial?.per_page ?? DEFAULT_PAGINATION.per_page,
  };
}

/**
 * Check if there are more pages to load.
 */
export function hasNextPage(pagination: PaginationMeta): boolean {
  if (
    pagination.current_page === undefined ||
    pagination.total_pages === undefined
  ) {
    return false;
  }
  return pagination.current_page < pagination.total_pages;
}

/**
 * Check if there are previous pages.
 */
export function hasPreviousPage(pagination: PaginationMeta): boolean {
  if (pagination.current_page === undefined) {
    return false;
  }
  return pagination.current_page > 1;
}
