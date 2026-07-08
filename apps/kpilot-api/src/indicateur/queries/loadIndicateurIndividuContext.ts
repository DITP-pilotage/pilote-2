import { type FonctionAgregation } from '@pilote/kpilot-shared/indicateur'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export const loadIndividusParPublicId = async (
  publicIds: ReadonlyArray<string>,
): Promise<IndividuRef[]> => {
  const rows = await db().individu.findMany({
    where: { publicId: { in: [...publicIds] } },
    orderBy: { publicId: 'asc' },
  })
  return rows.map(({ id, publicId, referentielId }) => ({ id, publicId, referentielId }))
}

export const loadSousArbre = async (
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

export const loadFonctionsAgregation = async (
  indicateurId: string,
): Promise<Map<string, FonctionAgregation>> => {
  const liens = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
  })
  return new Map(liens.map((lien) => [lien.referentielId, lien.fonctionAgregation]))
}
