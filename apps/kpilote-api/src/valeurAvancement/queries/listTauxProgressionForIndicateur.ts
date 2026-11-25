import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'
import {
  type ListTauxProgressionQuery,
  type TauxProgressionListApiModel,
  type TauxProgressionPointApiModel,
} from '@pilote/kpilote-shared/tauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { compareBuckets, formatBucket, parseBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { loadIndividusParPublicId } from '@/indicateur/loadIndicateurIndividuContext'
import { computeTauxProgressionPoints } from '@/valeurAvancement/computeTauxProgressionPoints'

// Défauts compromis lisibilité × coût : mensuel des deux côtés (cf. doc archi
// `taux-progression.md`). Surchargeable par requête, avec la contrainte
// `dateTruncObjectif >= dateTruncValeur` (validée côté schema mb-shared) — un
// objectif qui change plus souvent que les mesures n'a pas de sens.
const DEFAULT_DATE_TRUNC_VALEUR: DateTrunc = 'month'
const DEFAULT_DATE_TRUNC_OBJECTIF: DateTrunc = 'month'

type ListTauxProgressionForIndicateurParams = {
  indicateurPublicId: string
  query: ListTauxProgressionQuery
}

const performList = async ({
  indicateurPublicId,
  query,
}: ListTauxProgressionForIndicateurParams): Promise<TauxProgressionListApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true, publicId: true, sensSouhaite: true },
  })
  return buildList({ indicateur, query })
}

export const listTauxProgressionForIndicateur = (
  params: ListTauxProgressionForIndicateurParams,
): ResultAsync<TauxProgressionListApiModel, never> =>
  ResultAsync.fromSafePromise(performList(params))

const buildList = async ({
  indicateur,
  query,
}: {
  indicateur: { id: string; publicId: string; sensSouhaite: SensSouhaite }
  query: ListTauxProgressionQuery
}): Promise<TauxProgressionListApiModel> => {
  const individusCibles = await loadIndividusParPublicId(query.individus)
  if (individusCibles.length === 0) return { items: [] }

  const dateTruncValeur = query.dateTruncValeur ?? DEFAULT_DATE_TRUNC_VALEUR
  const dateTruncObjectif = query.dateTruncObjectif ?? DEFAULT_DATE_TRUNC_OBJECTIF
  const startedAt = performance.now()

  const points = await computeTauxProgressionPoints({
    indicateurId: indicateur.id,
    sensSouhaite: indicateur.sensSouhaite,
    individusCibles: individusCibles,
    dateTruncValeur,
    dateTruncObjectif,
  })

  // Filtres dateDebut/dateFin appliqués en sortie pour ne pas perturber le
  // carry-forward des séries dérivées (cf. design doc indicateur-derives.md).
  const dateDebut = query.dateDebut ? parseBucket(query.dateDebut) : null
  const dateFin = query.dateFin ? parseBucket(query.dateFin) : null
  const filtered = points.filter((p) => {
    if (dateDebut && compareBuckets(p.date, dateDebut) < 0) return false
    if (dateFin && compareBuckets(p.date, dateFin) > 0) return false
    return true
  })

  filtered.sort((a, b) =>
    a.individuPublicId !== b.individuPublicId
      ? a.individuPublicId.localeCompare(b.individuPublicId)
      : compareBuckets(a.date, b.date),
  )

  const items: TauxProgressionPointApiModel[] = filtered.map((p) => ({
    indicateur: indicateur.publicId,
    individu: p.individuPublicId,
    date: formatBucket(p.date),
    valeur: p.valeur.toNumber(),
    valeurCible: p.valeurCible.toNumber(),
    dateCible: formatBucket(p.dateCible),
    tauxProgression: p.tauxProgression,
  }))

  logger.info(
    {
      event: 'tauxProgression.listTauxProgressionForIndicateur.timing',
      indicateurId: indicateur.id,
      dateTruncValeur,
      dateTruncObjectif,
      nbCibles: individusCibles.length,
      nbPoints: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listTauxProgressionForIndicateur computed',
  )
  return { items }
}
