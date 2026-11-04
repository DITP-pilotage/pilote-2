import { type NamedEntity } from '@pilote/kpilote-shared/assistant/tools'

import { type NamePage } from '@/assistant/tools/search/searchEntities'
import { withCollectionReadPermission } from '@/collection/permissions'
import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'

// Requêtes légères pour la recherche : identifiant et nom seulement, sous les mêmes
// filtres d'habilitation que les routes de liste.

const containing = (term: string | undefined) =>
  term ? { nom: { contains: term, mode: 'insensitive' as const } } : {}

const toNamed = (row: { publicId: string; nom: string }): NamedEntity => ({
  id: row.publicId,
  nom: row.nom,
})

export const findIndicateurNames = async ({
  term,
  limit,
}: {
  term?: string
  limit: number
}): Promise<NamePage> => {
  const where = withIndicateurReadPermission(containing(term), requireCurrentPrincipalId(), {
    isAdmin: isAdminPrincipal(),
  })
  const [rows, total] = await Promise.all([
    db().indicateur.findMany({
      where,
      select: { publicId: true, nom: true },
      orderBy: { nom: 'asc' },
      take: limit,
    }),
    db().indicateur.count({ where }),
  ])
  return { items: rows.map(toNamed), total }
}

export const findCollectionNames = async ({
  term,
  limit,
}: {
  term?: string
  limit: number
}): Promise<NamePage> => {
  const where = withCollectionReadPermission(containing(term), requireCurrentPrincipalId())
  const [rows, total] = await Promise.all([
    db().collection.findMany({
      where,
      select: { publicId: true, nom: true },
      orderBy: { nom: 'asc' },
      take: limit,
    }),
    db().collection.count({ where }),
  ])
  return { items: rows.map(toNamed), total }
}

export const findIndividuNames = async ({
  term,
  referentielId,
  limit,
}: {
  term?: string
  referentielId?: string
  limit: number
}): Promise<NamePage> => {
  const where = {
    ...containing(term),
    ...(referentielId ? { referentiel: { publicId: referentielId } } : {}),
  }
  const [rows, total] = await Promise.all([
    db().individu.findMany({
      where,
      select: { publicId: true, nom: true, referentiel: { select: { publicId: true, nom: true } } },
      orderBy: { nom: 'asc' },
      take: limit,
    }),
    db().individu.count({ where }),
  ])
  return {
    items: rows.map((row) => ({ ...toNamed(row), referentiel: toNamed(row.referentiel) })),
    total,
  }
}
