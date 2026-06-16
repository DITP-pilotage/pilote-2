import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type GetPanierTauxProgressionQuery,
  type PanierTauxProgressionApiModel,
  type PanierTauxProgressionContributionApiModel,
} from '@pilote/mb-shared/panierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Bucket, compareBuckets, formatBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withPanierReadPermission } from '@/panier/permissions'
import {
  type IndicateurContribution,
  resolvePanierTauxProgression,
} from '@/panier/resolvePanierTauxProgression'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

// Aligné sur la route /indicateurs/:id/taux-progression : `month/month` est
// le défaut documenté (cf. docs/architecture/taux-progression.md). Pas exposé
// en query côté panier en v0.
const DATE_TRUNC_VALEUR: DateTrunc = 'month'
const DATE_TRUNC_OBJECTIF: DateTrunc = 'month'

export const getPanierTauxProgression = (
  panierPublicId: string,
  params: GetPanierTauxProgressionQuery,
): ResultAsync<PanierTauxProgressionApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId: panierPublicId }, principalId),
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
    }),
  ).andThen((panier) => ResultAsync.fromSafePromise(buildResult({ panier, params })))
}

type PanierRow = {
  id: string
  publicId: string
  indicateurs: ReadonlyArray<{
    ponderation: Decimal
    indicateur: { id: string; publicId: string }
  }>
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

  const contributions: IndicateurContribution[] = []
  for (const { indicateur: ind, ponderation } of panier.indicateurs) {
    const dernier = await computeDernierTaux({ indicateurId: ind.id, cible })
    contributions.push({
      indicateurPublicId: ind.publicId,
      tauxProgression: dernier?.tauxProgression ?? null,
      date: dernier?.date ?? null,
      ponderation,
    })
  }

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

// Sélectionne le dernier bucket parmi les points calculés par le pipeline
// taux-progression. La règle « tout-ou-rien » côté panier veut que tout
// indicateur dont l'un des prérequis manque (pas de série, pas d'objectif,
// dernier objectif à 0) produise `null` — ce qui correspond ici à l'absence
// de point ou à un dernier point sans taux.
const computeDernierTaux = async ({
  indicateurId,
  cible,
}: {
  indicateurId: string
  cible: IndividuRef
}): Promise<{ tauxProgression: number | null; date: Bucket } | null> => {
  const points = await computeTauxProgressionPoints({
    indicateurId,
    cibles: [cible],
    dateTruncValeur: DATE_TRUNC_VALEUR,
    dateTruncObjectif: DATE_TRUNC_OBJECTIF,
  })
  if (points.length === 0) return null

  const dernier = points.reduce<TauxProgressionPoint>(
    (acc, p) => (compareBuckets(p.date, acc.date) > 0 ? p : acc),
    points[0]!,
  )
  return { tauxProgression: dernier.tauxProgression, date: dernier.date }
}
