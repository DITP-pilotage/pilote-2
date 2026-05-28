import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'
import { type DateTrunc } from '@pilote/mb-shared/valeurAvancement'

import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { getObjectifsTronquesPourIndividus } from '@/generated/prisma/sql'
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

const loadSousArbre = async (
  cibles: ReadonlyArray<IndividuRef>,
): Promise<{
  allNodes: Map<string, IndividuRef>
  enfantsParParent: Map<string, IndividuRef[]>
}> => {
  const allNodes = new Map<string, IndividuRef>()
  for (const cible of cibles) allNodes.set(cible.id, cible)
  const enfantsParParent = new Map<string, IndividuRef[]>()
  let currentLevel = cibles.map((c) => c.id)

  while (currentLevel.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: currentLevel } },
      include: { child: true },
    })
    if (relations.length === 0) break

    const nextLevelSet = new Set<string>()
    for (const relation of relations) {
      const childRef: IndividuRef = {
        id: relation.child.id,
        publicId: relation.child.publicId,
        referentielId: relation.child.referentielId,
      }
      if (!allNodes.has(childRef.id)) {
        allNodes.set(childRef.id, childRef)
        nextLevelSet.add(childRef.id)
      }
      const liste = enfantsParParent.get(relation.parentId) ?? []
      liste.push(childRef)
      enfantsParParent.set(relation.parentId, liste)
    }
    currentLevel = [...nextLevelSet]
  }

  return { allNodes, enfantsParParent }
}

const loadFonctionsAgregation = async (
  indicateurId: string,
): Promise<Map<string, FonctionAgregation>> => {
  const liens = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
  })
  return new Map(liens.map((lien) => [lien.referentielId, lien.fonctionAgregation]))
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
