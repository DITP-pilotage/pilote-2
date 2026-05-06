export const PAGE_SIZE = 5

export const encodeCursor = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

export const decodeCursor = (cursor: string | undefined): string | undefined => {
  if (!cursor) return undefined
  return Buffer.from(cursor, 'base64url').toString('utf8')
}

export const buildPaginationArgs = <F extends string>(
  cursor: string | undefined,
  cursorField: F,
) => {
  const decoded = decodeCursor(cursor)
  return {
    take: PAGE_SIZE + 1,
    ...(decoded && { cursor: { [cursorField]: decoded } as Record<F, string>, skip: 1 }),
  }
}

export const toPaginatedResponse = <Row, Item extends { id: string }>(
  rows: Row[],
  total: number,
  mapItem: (row: Row) => Item,
) => {
  const hasMore = rows.length > PAGE_SIZE
  const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(mapItem)
  const nextCursor = hasMore && items.length > 0 ? encodeCursor(items[items.length - 1]!.id) : null

  return {
    items,
    pagination: { cursor: nextCursor, hasMore },
    total,
  }
}
