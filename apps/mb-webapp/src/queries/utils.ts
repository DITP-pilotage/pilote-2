export const DEFAULT_STALE_TIME = 5 * 60 * 1000

type PaginatedPage<T> = {
  items: T[]
  pagination: { hasMore: boolean; cursor: string | null }
}

export const fetchAllPaginatedItems = async <T>(
  fetchPage: (cursor: string | undefined) => Promise<PaginatedPage<T>>,
): Promise<T[]> => {
  const items: T[] = []
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    cursor = page.pagination.hasMore && page.pagination.cursor ? page.pagination.cursor : undefined
  } while (cursor)
  return items
}
