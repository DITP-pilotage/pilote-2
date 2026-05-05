export const PAGE_SIZE = 5

export const buildPaginationArgs = <F extends string>(
  cursor: string | undefined,
  cursorField: F,
) => ({
  take: PAGE_SIZE + 1,
  ...(cursor && { cursor: { [cursorField]: cursor } as Record<F, string>, skip: 1 }),
})

export const toPaginatedResponse = <Row, Item extends { id: string }>(
  rows: Row[],
  total: number,
  mapItem: (row: Row) => Item,
) => {
  const hasMore = rows.length > PAGE_SIZE
  const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(mapItem)
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null

  return {
    items,
    pagination: { cursor: nextCursor, hasMore },
    total,
  }
}
