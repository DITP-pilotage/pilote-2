import { type DateTrunc } from '@pilote/kpilote-shared/dates'
import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import { type BucketKey, parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getObjectifsTronquesForIndividus } from '@/generated/prisma/sql'
import { loadFonctionsAgregation, loadSousArbre } from '@/indicateur/loadIndicateurIndividuContext'
import {
  type ObjectifSaisieBucketise,
  type ResolveObjectifContext,
} from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

export type ObjectifHierarchy = {
  indicateurId: string
  allNodes: Map<string, IndividuRef>
  enfantsByParent: Map<string, IndividuRef[]>
  fonctionAgregationByReferentiel: Map<string, FonctionAgregation>
  referentielByIndividu: Map<string, string>
}

// Le sous-arbre des cibles et les fonctions d'agrégation, qui ne dépendent pas
// du découpage : un appelant qui lit les objectifs à plusieurs découpages ne
// les charge qu'une fois.
export const loadObjectifHierarchy = async ({
  indicateurId,
  individusCibles,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
}): Promise<ObjectifHierarchy> => {
  const [{ allNodes, enfantsByParent }, fonctionAgregationByReferentiel] = await Promise.all([
    loadSousArbre(individusCibles),
    loadFonctionsAgregation(indicateurId),
  ])
  return {
    indicateurId,
    allNodes,
    enfantsByParent,
    fonctionAgregationByReferentiel,
    referentielByIndividu: new Map(
      [...allNodes.values()].map((individu) => [individu.id, individu.referentielId]),
    ),
  }
}

export const buildResolveObjectifContext = async ({
  hierarchy,
  dateTrunc,
}: {
  hierarchy: ObjectifHierarchy
  dateTrunc: DateTrunc
}): Promise<ResolveObjectifContext> => ({
  enfantsByParent: hierarchy.enfantsByParent,
  fonctionAgregationByReferentiel: hierarchy.fonctionAgregationByReferentiel,
  referentielByIndividu: hierarchy.referentielByIndividu,
  objectifBucketByIndividu: await loadObjectifsBucketises({
    indicateurId: hierarchy.indicateurId,
    individuIds: [...hierarchy.allNodes.keys()],
    dateTrunc,
  }),
})

export const loadResolveObjectifContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<{ ctx: ResolveObjectifContext; allNodes: Map<string, IndividuRef> }> => {
  const hierarchy = await loadObjectifHierarchy({ indicateurId, individusCibles })
  const ctx = await buildResolveObjectifContext({ hierarchy, dateTrunc })
  return { ctx, allNodes: hierarchy.allNodes }
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
    getObjectifsTronquesForIndividus(indicateurId, [...individuIds], dateTrunc),
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
