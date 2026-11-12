import {
  MAX_PERIMETRE_INDIVIDUS,
  type EntityRef,
  type Perimetre,
} from '@pilote/kpilote-shared/assistant/tools'

import { db } from '@/framework/persistence/dbStore'

export { MAX_PERIMETRE_INDIVIDUS } from '@pilote/kpilote-shared/assistant/tools'

export type ResolvedPerimetre = {
  individus: EntityRef[]
  notFound: string[]
  total: number
  truncated: boolean
}

const toRef = (row: { publicId: string; nom: string }): EntityRef => ({
  id: row.publicId,
  nom: row.nom,
})

const bounded = (rows: ReadonlyArray<{ publicId: string; nom: string }>, notFound: string[]) => ({
  individus: rows.slice(0, MAX_PERIMETRE_INDIVIDUS).map(toRef),
  notFound,
  total: rows.length,
  truncated: rows.length > MAX_PERIMETRE_INDIVIDUS,
})

/** Les individus désignés par un périmètre, bornés et triés par nom. */
export const resolvePerimetre = async (perimetre: Perimetre): Promise<ResolvedPerimetre> => {
  const select = { publicId: true, nom: true }
  switch (perimetre.type) {
    case 'SELECTION': {
      const rows = await db().individu.findMany({
        where: { publicId: { in: perimetre.individuIds } },
        select,
        orderBy: { nom: 'asc' },
      })
      const found = new Set(rows.map((row) => row.publicId))
      return bounded(
        rows,
        perimetre.individuIds.filter((id) => !found.has(id)),
      )
    }
    case 'ENFANTS_DE': {
      const parent = await db().individu.findUnique({
        where: { publicId: perimetre.individuId },
        select: { id: true },
      })
      if (!parent) return bounded([], [perimetre.individuId])
      const rows = await db().individu.findMany({
        where: { relationsAsChild: { some: { parentId: parent.id } } },
        select,
        orderBy: { nom: 'asc' },
      })
      return bounded(rows, [])
    }
    case 'TOUT_LE_REFERENTIEL': {
      const rows = await db().individu.findMany({
        where: { referentiel: { publicId: perimetre.referentielId } },
        select,
        orderBy: { nom: 'asc' },
      })
      return bounded(rows, rows.length === 0 ? [perimetre.referentielId] : [])
    }
  }
}
