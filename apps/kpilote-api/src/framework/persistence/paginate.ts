export const DEFAULT_PAGE_SIZE = 20

export const encodeCursor = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url')

export const decodeCursor = (cursor: string | undefined): string | undefined => {
  if (!cursor) return undefined
  return Buffer.from(cursor, 'base64url').toString('utf8')
}

export const buildPaginationArgs = (cursor: string | undefined, pageSize?: number) => {
  const size = pageSize ?? DEFAULT_PAGE_SIZE
  const decoded = decodeCursor(cursor)
  return {
    take: size + 1,
    ...(decoded && { cursor: { id: decoded }, skip: 1 }),
  }
}

export const toPaginatedResponse = <Row extends { id: string }, Item>(
  rows: Row[],
  total: number,
  mapItem: (row: Row) => Item,
  pageSize?: number,
) => {
  const size = pageSize ?? DEFAULT_PAGE_SIZE
  const hasMore = rows.length > size
  const trimmedRows = hasMore ? rows.slice(0, size) : rows
  const lastRow = trimmedRows[trimmedRows.length - 1]
  const nextCursor = hasMore && lastRow ? encodeCursor(lastRow.id) : null

  return {
    items: trimmedRows.map(mapItem),
    pagination: { cursor: nextCursor, hasMore },
    total,
  }
}
