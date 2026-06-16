import { type DateTrunc } from '@pilote/mb-shared/dates'
import {
  type GetPanierTauxProgressionQuery,
  type PanierTauxProgressionApiModel,
  type PanierTauxProgressionContributionApiModel,
} from '@pilote/mb-shared/panierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { loadResolveObjectifContext } from '@/objectifIndicateurIndividu/queries/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { withPanierReadPermission } from '@/panier/permissions'
import {
  type IndicateurContribution,
  resolvePanierTauxProgression,
} from '@/panier/resolvePanierTauxProgression'
import {
  type ObjectifBrut,
  resolveTauxProgression,
  type ValeurBrute,
} from '@/valeurAvancement/resolveTauxProgression'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
} from '@/valeurAvancement/resolveSerieIndividu'

// Pondération uniforme en v0 : moyenne arithmétique des taux des indicateurs
// du panier. Le resolver pur reçoit déjà un Decimal pour préserver la précision.
const PONDERATION_DEFAUT = new Decimal(1)

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
          select: { indicateur: { select: { id: true, publicId: true } } },
        },
      },
    }),
  ).andThen((panier) => ResultAsync.fromSafePromise(buildResult({ panier, params })))
}

type PanierRow = {
  id: string
  publicId: string
  indicateurs: ReadonlyArray<{ indicateur: { id: string; publicId: string } }>
}

const buildResult = async ({
  panier,
  params,
}: {
  panier: PanierRow
  params: GetPanierTauxProgressionQuery
}): Promise<PanierTauxProgressionApiModel> => {
  const startedAt = performance.now()
  const indicateurs = panier.indicateurs.map((p) => p.indicateur)

  // Panier vide → result null, contributions vide.
  if (indicateurs.length === 0) {
    return {
      panier: panier.publicId,
      individu: params.individu,
      tauxProgression: null,
      contributions: [],
    }
  }

  const [cible] = await loadIndividusParPublicId([params.individu])
  // Individu inconnu : aucune contribution calculable → tout-ou-rien → null.
  if (!cible) {
    return {
      panier: panier.publicId,
      individu: params.individu,
      tauxProgression: null,
      contributions: indicateurs.map((ind) => ({
        indicateur: ind.publicId,
        tauxProgression: null,
        date: null,
        ponderation: PONDERATION_DEFAUT.toNumber(),
      })),
    }
  }

  const contributions: IndicateurContribution[] = []
  for (const ind of indicateurs) {
    const dernier = await computeDernierTaux({ indicateurId: ind.id, cible })
    contributions.push({
      indicateurPublicId: ind.publicId,
      tauxProgression: dernier?.tauxProgression ?? null,
      date: dernier?.date ?? null,
      ponderation: PONDERATION_DEFAUT,
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
      event: 'panierTauxProgression.getPanierTauxProgression.timing',
      panierId: panier.id,
      individu: params.individu,
      nbIndicateurs: indicateurs.length,
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

// Calcule le dernier point taux-progression pour (indicateur, individu cible).
// Réutilise exactement le pipeline de /indicateurs/:id/taux-progression
// (résoluteurs purs + contextes bulkés) mais ne retient que le bucket max.
const computeDernierTaux = async ({
  indicateurId,
  cible,
}: {
  indicateurId: string
  cible: IndividuRef
}): Promise<{ tauxProgression: number | null; date: PointInterne['bucket'] } | null> => {
  const [{ ctx: serieCtx }, { ctx: objectifCtx }] = await Promise.all([
    loadResolveSerieContext({
      indicateurId,
      cibles: [cible],
      dateTrunc: DATE_TRUNC_VALEUR,
    }),
    loadResolveObjectifContext({
      indicateurId,
      cibles: [cible],
      dateTrunc: DATE_TRUNC_OBJECTIF,
    }),
  ])
  const serieCache = new Map<string, ReadonlyArray<PointInterne>>()
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()

  const serie = await resolveSerieIndividu(cible.id, serieCtx, serieCache)
  if (serie.length === 0) return null

  const valeurs: ValeurBrute[] = serie.map((point) => ({
    individuId: cible.id,
    individuPublicId: cible.publicId,
    date: point.bucket,
    valeur: point.valeur,
  }))

  const objectifsMap = resolveObjectifIndividu(cible.id, objectifCtx, objectifCache)
  if (objectifsMap.size === 0) return null

  const objectifsList: ObjectifBrut[] = [...objectifsMap.values()]
    .map((point) => ({ dateCible: point.bucket, valeurCible: point.valeur }))
    .sort((a, b) => compareBuckets(a.dateCible, b.dateCible))

  const points = resolveTauxProgression({
    valeurs,
    objectifsParIndividu: new Map([[cible.id, objectifsList]]),
  })
  if (points.length === 0) return null

  // Dernier bucket dans le temps (resolveTauxProgression conserve l'ordre des
  // valeurs en entrée, mais on ne dépend pas de ce détail d'implémentation).
  const dernier = points.reduce((acc, p) => (compareBuckets(p.date, acc.date) > 0 ? p : acc))
  return { tauxProgression: dernier.tauxProgression, date: dernier.date }
}
