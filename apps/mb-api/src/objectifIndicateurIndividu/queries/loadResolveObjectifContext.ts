import { type DateTrunc } from '@pilote/mb-shared/dates'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { getObjectifsTronquesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import { type ResolveObjectifContext } from '@/objectifIndicateurIndividu/resolveObjectifIndividu'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export const loadResolveObjectifContext = async ({
  indicateurId,
  cibles,
  dateTrunc,
}: {
  indicateurId: string
  cibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<{ ctx: ResolveObjectifContext; allNodes: Map<string, IndividuRef> }> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(cibles),
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
}): Promise<Map<string, Map<string, Decimal>>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getObjectifsTronquesPourIndividus(indicateurId, [...individuIds], dateTrunc),
  )
  const result = new Map<string, Map<string, Decimal>>()
  for (const row of rows) {
    if (!row.bucket) continue
    const buckets = result.get(row.individuId) ?? new Map<string, Decimal>()
    buckets.set(row.bucket, new Decimal(row.valeurCible.toString()))
    result.set(row.individuId, buckets)
  }
  return result
}
