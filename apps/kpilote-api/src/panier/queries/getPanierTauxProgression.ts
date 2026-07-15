import {
  type GetPanierTauxProgressionQuery,
  type PanierTauxProgressionApiModel,
  type PanierTauxProgressionContributionApiModel,
} from '@pilote/kpilote-shared/panierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeContributions } from '@/panier/queries/computePanierContributions'
import { withPanierReadPermission } from '@/panier/permissions'
import { resolvePanierTauxProgression } from '@/panier/resolvePanierTauxProgression'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

const panierTauxProgressionArgs = {
  select: {
    id: true,
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true } },
      },
    },
  },
} satisfies Prisma.PanierDefaultArgs

type PanierRow = Prisma.PanierGetPayload<typeof panierTauxProgressionArgs>

export const getPanierTauxProgression = (
  panierPublicId: string,
  params: GetPanierTauxProgressionQuery,
): ResultAsync<PanierTauxProgressionApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId: panierPublicId }, principalId),
      ...panierTauxProgressionArgs,
    }),
  ).andThen((panier) => ResultAsync.fromSafePromise(buildResult({ panier, params })))
}

const buildResult = async ({
  panier,
  params,
}: {
  panier: PanierRow
  params: GetPanierTauxProgressionQuery
}): Promise<PanierTauxProgressionApiModel> => {
  const startedAt = performance.now()

  // Panier vide → result null, contributions vide.
  if (panier.indicateurs.length === 0) {
    return {
      panier: panier.publicId,
      individu: params.individu,
      tauxProgression: null,
      contributions: [],
    }
  }

  // Individu inconnu → 404 via le handler global (mappe Prisma P2025).
  const cible: IndividuRef = await db().individu.findFirstOrThrow({
    where: { publicId: params.individu },
    select: { id: true, publicId: true, referentielId: true },
  })

  const contributions = await computeContributions(panier.indicateurs, cible)

  const { tauxProgression } = resolvePanierTauxProgression(contributions)

  const apiContributions: PanierTauxProgressionContributionApiModel[] = contributions.map((c) => ({
    indicateur: c.indicateurPublicId,
    tauxProgression: c.tauxProgression,
    date: c.date ? formatBucket(c.date) : null,
    ponderation: c.ponderation.toNumber(),
  }))

  logger.info(
    {
      event: 'panier.getPanierTauxProgression.timing',
      panierId: panier.id,
      individu: params.individu,
      nbIndicateurs: panier.indicateurs.length,
      tauxProgression,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'getPanierTauxProgression computed',
  )

  return {
    panier: panier.publicId,
    individu: params.individu,
    tauxProgression,
    contributions: apiContributions,
  }
}
