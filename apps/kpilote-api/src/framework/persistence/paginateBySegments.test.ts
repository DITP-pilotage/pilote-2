import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import {
  encodeSegmentCursor,
  paginateBySegments,
  type SegmentPageArgs,
} from '@/framework/persistence/paginateBySegments'

type Row = { id: string }

// Un segment est la liste ordonnée de ses ids. Le findMany factice reproduit le
// curseur Prisma : il reprend à la ligne du curseur (sautée par `skip`), et ne
// renvoie rien si elle n'est pas dans le segment.
const findMany = ({ where, take, cursor, skip = 0 }: SegmentPageArgs<string[]>) => {
  const start = cursor ? where.indexOf(cursor.id) : 0
  const rows = start === -1 ? [] : where.slice(start + skip, start + skip + take)
  return Promise.resolve(rows.map((id): Row => ({ id })))
}

const page = (params: { segments: string[][]; cursor?: string; pageSize: number }) =>
  paginateBySegments({ ...params, cursor: params.cursor, findMany })

const ids = (rows: Row[]) => rows.map((row) => row.id)

describe.concurrent('paginateBySegments', () => {
  it('pagine un seul segment comme une liste simple', async () => {
    const firstPage = await page({ segments: [['A', 'B', 'C']], pageSize: 2 })

    expect(ids(firstPage.rows)).toEqual(['A', 'B'])
    expect(firstPage.pagination).toEqual({
      cursor: encodeSegmentCursor({ segment: 0, id: 'B' }),
      hasMore: true,
    })

    const secondPage = await page({
      segments: [['A', 'B', 'C']],
      cursor: firstPage.pagination.cursor!,
      pageSize: 2,
    })
    expect(ids(secondPage.rows)).toEqual(['C'])
    expect(secondPage.pagination).toEqual({ cursor: null, hasMore: false })
  })

  it('complète une page avec le début du segment suivant', async () => {
    const result = await page({
      segments: [
        ['A', 'C', 'F'],
        ['B', 'D', 'E', 'G'],
      ],
      pageSize: 4,
    })

    expect(ids(result.rows)).toEqual(['A', 'C', 'F', 'B'])
    expect(result.pagination).toEqual({
      cursor: encodeSegmentCursor({ segment: 1, id: 'B' }),
      hasMore: true,
    })
  })

  it('passe au segment suivant quand un segment se termine pile en fin de page', async () => {
    const segments = [
      ['A', 'C', 'F'],
      ['B', 'D'],
    ]

    const firstPage = await page({ segments, pageSize: 3 })
    expect(ids(firstPage.rows)).toEqual(['A', 'C', 'F'])
    expect(firstPage.pagination).toEqual({
      cursor: encodeSegmentCursor({ segment: 0, id: 'F' }),
      hasMore: true,
    })

    const secondPage = await page({ segments, cursor: firstPage.pagination.cursor!, pageSize: 3 })
    expect(ids(secondPage.rows)).toEqual(['B', 'D'])
    expect(secondPage.pagination).toEqual({ cursor: null, hasMore: false })
  })

  it('termine sans page suivante quand le dernier segment se termine pile en fin de page', async () => {
    const result = await page({ segments: [['A', 'C'], []], pageSize: 2 })

    expect(ids(result.rows)).toEqual(['A', 'C'])
    expect(result.pagination).toEqual({ cursor: null, hasMore: false })
  })

  it('traverse un segment vide', async () => {
    const result = await page({ segments: [['A'], [], ['B', 'C']], pageSize: 5 })

    expect(ids(result.rows)).toEqual(['A', 'B', 'C'])
    expect(result.pagination).toEqual({ cursor: null, hasMore: false })
  })

  it('reprend dans le segment du curseur sans relire les précédents', async () => {
    const result = await page({
      segments: [
        ['A', 'C'],
        ['B', 'D', 'E'],
      ],
      cursor: encodeSegmentCursor({ segment: 1, id: 'B' }),
      pageSize: 5,
    })

    expect(ids(result.rows)).toEqual(['D', 'E'])
    expect(result.pagination).toEqual({ cursor: null, hasMore: false })
  })

  it('renvoie une page vide pour un curseur illisible', async () => {
    const result = await page({
      segments: [['A', 'B']],
      cursor: encodeCursor('A'),
      pageSize: 5,
    })

    expect(result).toEqual({ rows: [], pagination: { cursor: null, hasMore: false } })
  })
})
