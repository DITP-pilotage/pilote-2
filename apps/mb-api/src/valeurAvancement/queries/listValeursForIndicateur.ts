import {
  type ContributionApiModel,
  type DateTrunc,
  type ListValeursForIndicateurQuery,
  type ValeurAvancementApiModel,
  type ValeurAvancementListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  loadFonctionsAgregation,
  loadSaisiesTronquees,
  loadSousArbre,
} from '@/valeurAvancement/loadSerieContext'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
  type ResolveSerieContext,
} from '@/valeurAvancement/resolveSerieDerivee'

// Cap par défaut à la granularité mensuelle : sans troncature, une série France
// avec saisies quotidiennes par département explose (cf. design doc D11).
const DEFAULT_DATE_TRUNC: DateTrunc = 'month'

export const listValeursForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursForIndicateurQuery,
): ResultAsync<ValeurAvancementListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      buildSeries({ indicateurId: indicateur.id, indicateurPublicId, params }),
    ),
  )
}

// Orchestration en 3 phases : (1) charger en bulk l'arbre + les liens
// indicateur↔référentiel en parallèle, (2) charger les saisies tronquées en
// connaissant l'ensemble des descendants, (3) calculer les séries en mémoire
// via le functional core memoïsé (cf. resolveSerieDerivee + doc d'archi
// `indicateur-derives.md`). Filtrage dateDebut/dateFin appliqué en sortie.
const buildSeries = async ({
  indicateurId,
  indicateurPublicId,
  params,
}: {
  indicateurId: string
  indicateurPublicId: string
  params: ListValeursForIndicateurQuery
}): Promise<ValeurAvancementListApiModel> => {
  const cibles = await loadCibles(params.individus)
  if (cibles.length === 0) return { items: [] }

  // Indépendants entre eux : chargement parallèle pour minimiser la latence.
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(cibles),
    loadFonctionsAgregation(indicateurId),
  ])
  const dateTrunc: DateTrunc = params.dateTrunc ?? DEFAULT_DATE_TRUNC
  const serieFeuilleParIndividu = await loadSaisiesTronquees({
    indicateurId,
    individuIds: [...allNodes.keys()],
    dateTrunc,
  })

  const ctx: ResolveSerieContext = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    serieFeuilleParIndividu,
    referentielParIndividu: new Map(
      [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
    ),
  }
  const cache = new Map<string, ReadonlyArray<PointInterne>>()

  const items: ValeurAvancementApiModel[] = []
  for (const cible of cibles) {
    const serie = resolveSerieIndividu(cible.id, ctx, cache)
    for (const point of serie) {
      if (params.dateDebut && point.bucket < params.dateDebut) continue
      if (params.dateFin && point.bucket > params.dateFin) continue
      items.push(toApiModel({ indicateurPublicId, individuPublicId: cible.publicId, point }))
    }
  }
  return { items }
}

const loadCibles = (individus: ReadonlyArray<string>): Promise<IndividuRef[]> =>
  db().individu.findMany({
    where: { publicId: { in: [...individus] } },
    select: { id: true, publicId: true, referentielId: true },
    orderBy: { publicId: 'asc' },
  })

const toApiModel = ({
  indicateurPublicId,
  individuPublicId,
  point,
}: {
  indicateurPublicId: string
  individuPublicId: string
  point: PointInterne
}): ValeurAvancementApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuPublicId,
      date: point.bucket,
      valeur: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  const contributions: ContributionApiModel[] = point.contributions.map((c) => ({
    individu: c.individuPublicId,
    valeur: c.valeur === null ? null : c.valeur.toNumber(),
    date: c.dateOrigine,
    source: c.source,
  }))
  return {
    indicateur: indicateurPublicId,
    individu: individuPublicId,
    date: point.bucket,
    valeur: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions,
    couverture: point.couverture,
  }
}
