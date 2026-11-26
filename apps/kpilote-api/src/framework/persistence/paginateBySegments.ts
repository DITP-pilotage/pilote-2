import { z } from 'zod'

import { decodeCursor, DEFAULT_PAGE_SIZE, encodeCursor } from '@/framework/persistence/paginate'

// Pagination d'une liste découpée en segments : des filtres disjoints, dans
// l'ordre de la liste (« les indicateurs concernés, puis les autres »). Dans un
// segment, l'ordre est celui de la requête de l'appelant ; le curseur Prisma par
// `id` s'y applique tel quel, quel que soit l'orderBy.
//
// Le helper ne compose aucun filtre : il choisit le segment à lire, son curseur
// et le nombre de lignes, et laisse la requête (orderBy, include…) à l'appelant.

// Ce que le helper ajoute à la requête de l'appelant pour un segment.
export type SegmentPageArgs<Where> = {
  where: Where
  take: number
  cursor?: { id: string }
  skip?: number
}

export type SegmentPage<Row> = {
  rows: Row[]
  pagination: { cursor: string | null; hasMore: boolean }
}

type SegmentPosition = { segment: number; id: string }

// Le curseur porte le segment de la dernière ligne lue : la page suivante
// reprend dans ce segment sans avoir à le retrouver.
export const encodeSegmentCursor = ({ segment, id }: SegmentPosition): string =>
  encodeCursor(`${segment}:${id}`)

const segmentPositionSchema = z
  .string()
  .regex(/^\d+:.+$/)
  .transform((value): SegmentPosition => {
    const separator = value.indexOf(':')
    return { segment: Number(value.slice(0, separator)), id: value.slice(separator + 1) }
  })

export const paginateBySegments = async <Where, Row extends { id: string }>({
  segments,
  cursor,
  pageSize = DEFAULT_PAGE_SIZE,
  findMany,
}: {
  // Filtres disjoints, dans l'ordre de la liste.
  segments: ReadonlyArray<Where>
  cursor: string | undefined
  pageSize: number | undefined
  // La requête de l'appelant : elle fixe orderBy, include ou select, et étale `args`.
  findMany: (args: SegmentPageArgs<Where>) => Promise<Row[]>
}): Promise<SegmentPage<Row>> => {
  const encoded = decodeCursor(cursor)
  const position = encoded === undefined ? undefined : segmentPositionSchema.safeParse(encoded).data
  // Un curseur illisible ne désigne aucune ligne : page vide, comme un id inconnu.
  if (encoded !== undefined && position === undefined) {
    return { rows: [], pagination: { cursor: null, hasMore: false } }
  }

  // Une ligne de plus que la page dit s'il reste quelque chose, y compris quand
  // un segment se termine pile en fin de page.
  const read: Array<{ row: Row; segment: number }> = []
  for (let segment = position?.segment ?? 0; segment < segments.length; segment++) {
    if (read.length > pageSize) break
    const resume = position?.segment === segment ? { cursor: { id: position.id }, skip: 1 } : {}
    const rows = await findMany({
      where: segments[segment]!,
      take: pageSize + 1 - read.length,
      ...resume,
    })
    read.push(...rows.map((row) => ({ row, segment })))
  }

  const hasMore = read.length > pageSize
  const page = read.slice(0, pageSize)
  const last = page.at(-1)
  return {
    rows: page.map(({ row }) => row),
    pagination: {
      cursor:
        hasMore && last ? encodeSegmentCursor({ segment: last.segment, id: last.row.id }) : null,
      hasMore,
    },
  }
}
