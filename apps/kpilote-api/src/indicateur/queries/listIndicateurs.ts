import {
  type IndicateurListApiModel,
  type ListIndicateursQuery,
} from '@pilote/kpilote-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { paginateBySegments } from '@/framework/persistence/paginateBySegments'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { indicateurApiModelInclude, toIndicateurApiModel } from '@/indicateur/utils'
import { loadSelectedIndividus } from '@/individu/loadSelectedIndividus'

type ListIndicateursParams = {
  query: ListIndicateursQuery
}

export const listIndicateurs = (
  params: ListIndicateursParams,
): ResultAsync<IndicateurListApiModel, never> => ResultAsync.fromSafePromise(build(params))

const build = async ({ query }: ListIndicateursParams): Promise<IndicateurListApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.IndicateurWhereInput = {}
  if (query.recherche) {
    filters.nom = { contains: query.recherche, mode: 'insensitive' }
  }
  const publicId: Prisma.StringFilter<'Indicateur'> = {}
  if (query.rechercheIdentifiant) {
    publicId.contains = query.rechercheIdentifiant
    publicId.mode = 'insensitive'
  }
  if (query.ids && query.ids.length > 0) {
    publicId.in = query.ids
  }
  if (Object.keys(publicId).length > 0) filters.publicId = publicId
  // Toutes les actions de permission donnent la lecture : avoir une permission suffit.
  // Le filtre s'ajoute au contrôle de lecture et s'applique aussi aux admins.
  if (query.acces === 'attribue') {
    filters.OR = [
      { permissions: { some: { principalId } } },
      { collections: { some: { collection: { permissions: { some: { principalId } } } } } },
    ]
  }
  // L'id d'un utilisateur est celui de son principal ; une clé API n'a pas d'épingle.
  if (query.epingle === true) filters.epingles = { some: { utilisateurId: principalId } }
  if (query.epingle === false) filters.epingles = { none: { utilisateurId: principalId } }
  // Le bypass ADMIN (administre PUBLIC + PRIVÉ) est géré dans withIndicateurReadPermission.
  const where = withIndicateurReadPermission(filters, principalId, {
    isAdmin: isAdminPrincipal(),
  })

  const segments = await buildSegments({ where, selectedPublicIds: query.individus })
  const [page, total] = await Promise.all([
    paginateBySegments({
      segments,
      cursor: query.cursor,
      pageSize: query.pageSize,
      findMany: (args) =>
        db().indicateur.findMany({
          ...args,
          orderBy: { id: 'asc' },
          include: indicateurApiModelInclude,
        }),
    }),
    db().indicateur.count({ where }),
  ])

  // Une seule requête pour toutes les dernières valeurs de la page (évite le N+1).
  // La date est en `YYYY-MM-DD` : MAX lexicographique = MAX chronologique.
  // Toutes combinaisons confondues (cf. getIndicateurByPublicId).
  const maxDates = await db().valeurAvancement.groupBy({
    by: ['indicateurId'],
    where: { indicateurId: { in: page.rows.map((row) => row.id) } },
    _max: { date: true },
  })
  const dateParIndicateur = new Map(maxDates.map((m) => [m.indicateurId, m._max.date]))
  return {
    items: page.rows.map((row) =>
      toIndicateurApiModel({
        indicateur: row,
        dateDerniereValeur: dateParIndicateur.get(row.id) ?? null,
      }),
    ),
    pagination: page.pagination,
    total,
  }
}

// Avec une sélection, les indicateurs qu'elle concerne passent en tête : ceux
// dont un référentiel lié est celui d'un individu sélectionné. La sélection ne
// filtre rien, elle ordonne.
const buildSegments = async ({
  where,
  selectedPublicIds,
}: {
  where: Prisma.IndicateurWhereInput
  selectedPublicIds: ReadonlyArray<string> | undefined
}): Promise<Prisma.IndicateurWhereInput[]> => {
  if (selectedPublicIds === undefined) return [where]
  const selectedIndividus = await loadSelectedIndividus(selectedPublicIds)
  const concernedBySelection: Prisma.IndicateurWhereInput = {
    referentiels: {
      some: {
        referentielId: { in: selectedIndividus.map((individu) => individu.referentielId) },
      },
    },
  }
  return [{ AND: [where, concernedBySelection] }, { AND: [where, { NOT: concernedBySelection }] }]
}
