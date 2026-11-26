import {
  MAX_PERIMETRE_INDIVIDUS,
  PERIMETRE_DESCRIPTION,
  type DatedValue,
  type EntityRef,
  type Perimetre,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { type IndicateurApiModel, type SensSouhaite } from '@pilote/kpilote-shared/indicateur'
import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { interpretDifference } from '@pilote/kpilote-shared/interpretation'

import { resolvePerimetre, type ResolvedPerimetre } from '@/assistant/tools/perimetre'
import { type QueryToolDefinition } from '@/assistant/tools/toolDefinition'
import { type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { type Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import {
  buildResolveObjectifContext,
  loadObjectifHierarchy,
} from '@/objectifIndicateurIndividu/loadResolveObjectifContext'
import {
  type PointObjectifInterne,
  type ResolveObjectifContext,
  resolveObjectifIndividu,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'
import { computeMax } from '@/valeurAvancement/computeMax'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeMin } from '@/valeurAvancement/computeMin'
import { buildTauxProgressionPoints } from '@/valeurAvancement/computeTauxProgressionPoints'
import { computeVariation } from '@/valeurAvancement/computeVariation'
import {
  loadReferentielsWithIndividus,
  type ReferentielWithIndividus,
} from '@/valeurAvancement/loadReferentielsWithIndividus'
import { loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type IndividuRef, type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

/** L'indicateur s'il existe et que le principal peut le lire, `null` sinon : l'API ne distingue pas. */
export const findReadableIndicateur = async (id: string): Promise<IndicateurApiModel | null> => {
  try {
    return (await getIndicateurByPublicId(id)).unwrapOr(null)
  } catch {
    return null
  }
}

const withoutIndividus = (
  output: Pick<SyntheseIndicateurOutput, 'indicateur'> & Partial<SyntheseIndicateurOutput>,
): SyntheseIndicateurOutput => ({
  individus: [],
  valeursRemarquables: [],
  notFound: [],
  ...output,
})

// Un périmètre explicite l'emporte ; à défaut, l'individu seul forme une sélection.
const resolveCible = async ({
  perimetre,
  individuId,
}: {
  perimetre: Perimetre | undefined
  individuId: string | undefined
}): Promise<ResolvedPerimetre | null> => {
  if (perimetre) return resolvePerimetre(perimetre)
  if (individuId) return resolvePerimetre({ type: 'SELECTION', individuIds: [individuId] })
  return null
}

// Le mois pour les valeurs et le taux, l'année pour l'objectif affiché : les
// découpages par défaut des écrans de valeurs, de taux et d'objectifs.
const DATE_TRUNC: DateTrunc = 'month'
const OBJECTIF_DATE_TRUNC: DateTrunc = 'year'
// La variation compare les deux derniers points ; la dernière valeur, la médiane,
// les valeurs remarquables et le taux ne lisent que le dernier.
const LAST_POINT_COUNT = 2

type RequestedIndividu = { entity: EntityRef; ref: IndividuRef }

type Series = {
  serieOf: (individu: IndividuRef) => ReadonlyArray<PointInterne>
  lastValeursByReferentiel: ReadonlyMap<string, ReadonlyArray<Decimal>>
  medianeByReferentiel: ReadonlyMap<string, Decimal | null>
}

// Une seule résolution, sur la population des référentiels en jeu, sert les
// quatre lectures : dernière valeur, variation, écart à la médiane et valeurs
// remarquables.
const readSeries = async ({
  indicateurId,
  referentiels,
}: {
  indicateurId: string
  referentiels: ReadonlyArray<ReferentielWithIndividus>
}): Promise<Series> => {
  const { serieOf } = await loadResolveSerieContext({
    indicateurId,
    individusCibles: referentiels.flatMap((referentiel) => referentiel.individus),
    dateTrunc: DATE_TRUNC,
    lastPointCount: LAST_POINT_COUNT,
  })
  const lastValeursByReferentiel = new Map(
    referentiels.map((referentiel) => [
      referentiel.id,
      referentiel.individus.flatMap((individu) => {
        const lastPoint = serieOf(individu).at(-1)
        return lastPoint ? [lastPoint.valeur] : []
      }),
    ]),
  )
  const medianeByReferentiel = new Map(
    [...lastValeursByReferentiel].map(([referentielId, valeurs]) => [
      referentielId,
      computeMediane(valeurs),
    ]),
  )
  return { serieOf, lastValeursByReferentiel, medianeByReferentiel }
}

// Les référentiels de l'indicateur seulement : ceux des individus demandés ne
// servent qu'à la médiane de leurs pairs.
const readValeursRemarquables = ({
  referentiels,
  series,
  indicateurReferentiels,
}: {
  referentiels: ReadonlyArray<ReferentielWithIndividus>
  series: Series
  indicateurReferentiels: ReadonlyArray<EntityRef>
}): SyntheseIndicateurOutput['valeursRemarquables'] => {
  const entityByPublicId = new Map(
    indicateurReferentiels.map((referentiel) => [referentiel.id, referentiel]),
  )
  return referentiels.flatMap((referentiel) => {
    const entity = entityByPublicId.get(referentiel.publicId)
    if (!entity) return []
    const valeurs = series.lastValeursByReferentiel.get(referentiel.id) ?? []
    return [
      {
        referentiel: entity,
        min: computeMin(valeurs),
        max: computeMax(valeurs),
        mediane: series.medianeByReferentiel.get(referentiel.id)?.toNumber() ?? null,
      },
    ]
  })
}

type ObjectifContexts = { displayed: ResolveObjectifContext; taux: ResolveObjectifContext }

// L'indicateur est déjà lu avec contrôle d'accès : les objectifs se chargent
// sans repasser par la query, qui refait ce contrôle. Les deux découpages
// partagent le même sous-arbre.
const loadObjectifContexts = async ({
  indicateurId,
  refs,
}: {
  indicateurId: string
  refs: ReadonlyArray<IndividuRef>
}): Promise<ObjectifContexts | null> => {
  if (refs.length === 0) return null
  const hierarchy = await loadObjectifHierarchy({ indicateurId, individusCibles: refs })
  const [displayed, taux] = await Promise.all([
    buildResolveObjectifContext({ hierarchy, dateTrunc: OBJECTIF_DATE_TRUNC }),
    buildResolveObjectifContext({ hierarchy, dateTrunc: DATE_TRUNC }),
  ])
  return { displayed, taux }
}

// L'objectif à la date cible la plus lointaine, comme sur l'écran des objectifs.
const lastObjectifOf = ({
  ref,
  ctx,
  cache,
}: {
  ref: IndividuRef
  ctx: ResolveObjectifContext
  cache: Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>
}): DatedValue | null => {
  const points = [...resolveObjectifIndividu({ individuId: ref.id, ctx, cache }).values()]
  const last = points.reduce<PointObjectifInterne | undefined>(
    (latest, point) =>
      latest && compareBuckets(latest.bucket, point.bucket) >= 0 ? latest : point,
    undefined,
  )
  return last ? { valeur: last.valeur.toNumber(), date: formatBucket(last.bucket) } : null
}

const buildIndividus = ({
  individus,
  sensSouhaite,
  series,
  objectifContexts,
}: {
  individus: ReadonlyArray<RequestedIndividu>
  sensSouhaite: SensSouhaite
  series: Series
  objectifContexts: ObjectifContexts
}): SyntheseIndicateurOutput['individus'] => {
  const refs = individus.map(({ ref }) => ref)
  // Les points d'un individu suivent sa série, par date croissante : le dernier
  // inscrit est le plus récent.
  const lastTauxByIndividu = new Map(
    buildTauxProgressionPoints({
      individusCibles: refs,
      serieOf: series.serieOf,
      objectifCtx: objectifContexts.taux,
      sensSouhaite,
    }).map((point) => [point.individuId, point.tauxProgression]),
  )
  const objectifCache = new Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>()
  const interpret = (difference: number | null) =>
    difference === null ? null : interpretDifference({ difference, sensSouhaite })

  return individus.map(({ entity, ref }) => {
    const serie = series.serieOf(ref)
    const lastPoint = serie.at(-1)
    // computeVariation attend [recente, precedente] ; la série est ASC par bucket.
    const variation = computeVariation(serie.slice(-2).reverse())
    const ecartMediane = computeEcartMediane(
      lastPoint?.valeur,
      series.medianeByReferentiel.get(ref.referentielId) ?? null,
    )
    return {
      individu: entity,
      derniereValeur: lastPoint
        ? { valeur: lastPoint.valeur.toNumber(), date: formatBucket(lastPoint.bucket) }
        : null,
      objectif: lastObjectifOf({ ref, ctx: objectifContexts.displayed, cache: objectifCache }),
      tauxProgression: lastTauxByIndividu.get(ref.id) ?? null,
      variation,
      lectureVariation: interpret(variation),
      ecartMediane,
      lectureEcartMediane: interpret(ecartMediane),
    }
  })
}

export const getSyntheseIndicateur: QueryToolDefinition<'get_synthese_indicateur'> = {
  description: `Renvoie l'état d'un indicateur en un appel : identité (nom, unité, référentiels), et pour chaque individu demandé sa dernière valeur, son objectif, son taux de progression, sa variation récente et son écart à la médiane ; plus les valeurs remarquables (min, max, médiane) de chaque référentiel.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
- \`truncated\` / \`total\` : le périmètre dépassait ${MAX_PERIMETRE_INDIVIDUS} individus ; dis-le.
- \`needsClarification\` : il manque l'individu ; demande-le à l'utilisateur.
- \`indicateur.sensSouhaite\` : HAUSSE, une valeur plus haute est meilleure ; BAISSE, une valeur plus basse est meilleure (ex. un taux de chômage). À la baisse, \`tauxProgression\` est toujours null par construction, ce n'est pas un manque de données ; le minimum est la meilleure valeur, le maximum la moins bonne.
- \`lectureVariation\` / \`lectureEcartMediane\` : favorable, unfavorable ou neutral selon ce sens. Dis si une évolution ou une position est bonne d'après eux, jamais d'après le seul signe.
Utilise-le pour : « où en est », l'avancement, l'état ou la comparaison d'un indicateur pour un ou plusieurs individus.
Ne l'utilise pas pour : la série complète dans le temps → get_evolution_indicateur ; une collection → get_synthese_collection.

${PERIMETRE_DESCRIPTION}`,
  execute: async ({ indicateurId, individuId, perimetre }) => {
    const indicateur = await findReadableIndicateur(indicateurId)
    if (!indicateur) return withoutIndividus({ indicateur: null, notFound: [indicateurId] })

    const identite = {
      id: indicateur.id,
      nom: indicateur.nom,
      unite: indicateur.unite?.libelle ?? null,
      description: indicateur.description,
      sensSouhaite: indicateur.sensSouhaite,
      referentiels: indicateur.referentiels.map((referentiel) => ({
        id: referentiel.id,
        nom: referentiel.nom,
      })),
    }

    const [{ id }, cible] = await Promise.all([
      db().indicateur.findUniqueOrThrow({
        where: { publicId: indicateurId },
        select: { id: true },
      }),
      resolveCible({ perimetre, individuId }),
    ])
    const requested = cible?.individus ?? []
    // La population contient les individus demandés : leurs référentiels en font partie.
    const referentiels = await loadReferentielsWithIndividus({
      referentielPublicIds: identite.referentiels.map((referentiel) => referentiel.id),
      individuPublicIds: requested.map((individu) => individu.id),
    })
    const refByPublicId = new Map(
      referentiels.flatMap((referentiel) =>
        referentiel.individus.map((ref) => [ref.publicId, ref] as const),
      ),
    )
    const individus: RequestedIndividu[] = requested.flatMap((entity) => {
      const ref = refByPublicId.get(entity.id)
      return ref ? [{ entity, ref }] : []
    })

    const [series, objectifContexts] = await Promise.all([
      readSeries({ indicateurId: id, referentiels }),
      loadObjectifContexts({ indicateurId: id, refs: individus.map(({ ref }) => ref) }),
    ])
    const valeursRemarquables = readValeursRemarquables({
      referentiels,
      series,
      indicateurReferentiels: identite.referentiels,
    })

    if (!cible) {
      return withoutIndividus({
        indicateur: identite,
        valeursRemarquables,
        needsClarification:
          'Les valeurs, objectifs et taux de progression se lisent pour un individu précis, et aucun n’a été désigné.',
      })
    }

    return {
      indicateur: identite,
      // Pas de contexte d'objectifs sans individu demandé.
      individus: objectifContexts
        ? buildIndividus({
            individus,
            sensSouhaite: indicateur.sensSouhaite,
            series,
            objectifContexts,
          })
        : [],
      valeursRemarquables,
      notFound: cible.notFound,
      ...(cible.truncated ? { total: cible.total, truncated: true } : {}),
    }
  },
}
