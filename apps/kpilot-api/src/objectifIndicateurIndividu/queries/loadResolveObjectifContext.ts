import { type DateTrunc } from '@pilote/kpilot-shared/dates'

import { type BucketKey, parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getObjectifsTronquesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import {
  type ObjectifSaisieBucketise,
  type ResolveObjectifContext,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export const loadResolveObjectifContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<{ ctx: ResolveObjectifContext; allNodes: Map<string, IndividuRef> }> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(individusCibles),
    loadFonctionsAgregation(indicateurId),
  ])
  const objectifBucketParIndividu = await loadObjectifsBucketises({
    indicateurId,
    individuIds: [...allNodes.keys()],
    dateTrunc,
  })

  const ctx: ResolveObjectifContext = {
    enfantsParParent,
    fonctionAgregationParReferentiel,
    objectifBucketParIndividu,
    referentielParIndividu: new Map(
      [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
    ),
  }
  return { ctx, allNodes }
}

const loadObjectifsBucketises = async ({
  indicateurId,
  individuIds,
  dateTrunc,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<Map<string, Map<BucketKey, ObjectifSaisieBucketise>>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getObjectifsTronquesPourIndividus(indicateurId, [...individuIds], dateTrunc),
  )
  const result = new Map<string, Map<BucketKey, ObjectifSaisieBucketise>>()
  for (const row of rows) {
    if (!row.bucket) continue
    const bucket = parseBucket(row.bucket)
    const buckets = result.get(row.individuId) ?? new Map<BucketKey, ObjectifSaisieBucketise>()
    buckets.set(row.bucket, { bucket, valeur: row.valeurCible })
    result.set(row.individuId, buckets)
  }
  return result
}
