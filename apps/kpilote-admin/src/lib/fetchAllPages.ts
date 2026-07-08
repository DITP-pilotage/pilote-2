type Page<T> = { items: T[]; pagination: { cursor: string | null; hasMore: boolean } }

export const fetchAllPages = async <T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): Promise<T[]> => {
  const all: T[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await fetchPage(cursor)
    all.push(...page.items)
    if (!page.pagination.hasMore || !page.pagination.cursor) break
    cursor = page.pagination.cursor
  }
  return all
}
