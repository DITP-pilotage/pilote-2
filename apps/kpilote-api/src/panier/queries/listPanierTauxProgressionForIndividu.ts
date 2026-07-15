import {
  type ListPanierTauxProgressionForIndividuQuery,
  type PanierTauxProgressionSummaryListApiModel,
} from '@pilote/kpilote-shared/panierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeContributions } from '@/panier/queries/computePanierContributions'
import { withPanierReadPermission } from '@/panier/permissions'
import { resolvePanierTauxProgression } from '@/panier/resolvePanierTauxProgression'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

const panierListArgs = {
  select: {
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' as const },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true } },
      },
    },
  },
} satisfies Prisma.PanierDefaultArgs

type PanierRow = Prisma.PanierGetPayload<typeof panierListArgs>

export const listPanierTauxProgressionForIndividu = (
  individuPublicId: string,
  params: ListPanierTauxProgressionForIndividuQuery,
): ResultAsync<PanierTauxProgressionSummaryListApiModel, never> =>
  ResultAsync.fromSafePromise(build(individuPublicId, params))

const build = async (
  individuPublicId: string,
  params: ListPanierTauxProgressionForIndividuQuery,
): Promise<PanierTauxProgressionSummaryListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const individuCible = await db().individu.findFirstOrThrow({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })

  const startedAt = performance.now()

  const paniers = await db().panier.findMany({
    where: withPanierReadPermission({ publicId: { in: params.paniers } }, principalId),
    ...panierListArgs,
  })

  const items = await Promise.all(paniers.map((panier) => computePanierTaux(panier, individuCible)))

  logger.info(
    {
      event: 'panier.listPanierTauxProgressionForIndividu.timing',
      individuId: individuCible.id,
      nbPaniersDemandes: params.paniers.length,
      nbPaniersAccessibles: paniers.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listPanierTauxProgressionForIndividu computed',
  )

  return { items }
}

const computePanierTaux = async (
  panier: PanierRow,
  individuCible: IndividuRef,
): Promise<{ panier: string; tauxProgression: number | null }> => {
  if (panier.indicateurs.length === 0) {
    return { panier: panier.publicId, tauxProgression: null }
  }

  const contributions = await computeContributions(panier.indicateurs, individuCible)
  const { tauxProgression } = resolvePanierTauxProgression(contributions)
  return { panier: panier.publicId, tauxProgression }
}
