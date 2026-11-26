import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { groupBy } from 'es-toolkit'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

export const loadIndividusByPublicId = async (
  publicIds: ReadonlyArray<string>,
): Promise<IndividuRef[]> => {
  const rows = await db().individu.findMany({
    where: { publicId: { in: [...publicIds] } },
    orderBy: { publicId: 'asc' },
  })
  return rows.map(({ id, publicId, referentielId }) => ({ id, publicId, referentielId }))
}

const toIndividuRef = ({ id, publicId, referentielId }: IndividuRef): IndividuRef => ({
  id,
  publicId,
  referentielId,
})

export const loadSousArbre = async (
  cibles: ReadonlyArray<IndividuRef>,
): Promise<{
  allNodes: Map<string, IndividuRef>
  enfantsByParent: Map<string, IndividuRef[]>
}> => {
  const allNodes = new Map<string, IndividuRef>()
  for (const cible of cibles) allNodes.set(cible.id, cible)
  const enfantsByParent = new Map<string, IndividuRef[]>()
  let currentLevel = cibles.map((cible) => cible.id)

  while (currentLevel.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: currentLevel } },
      include: { child: true },
    })
    if (relations.length === 0) break

    const nextLevel: string[] = []
    // Un individu déjà vu garde son objet : `allNodes` et `enfantsByParent` le partagent.
    const refOf = (child: IndividuRef): IndividuRef => {
      const known = allNodes.get(child.id)
      if (known) return known
      const ref = toIndividuRef(child)
      allNodes.set(child.id, ref)
      nextLevel.push(child.id)
      return ref
    }
    const enfants = relations.map(({ parentId, child }) => ({ parentId, enfant: refOf(child) }))
    // Un parent n'est interrogé qu'une fois : ses enfants arrivent tous dans ce niveau.
    const enfantsOfLevel = groupBy(enfants, (enfant) => enfant.parentId)
    for (const [parentId, parentEnfants] of Object.entries(enfantsOfLevel)) {
      enfantsByParent.set(
        parentId,
        parentEnfants.map(({ enfant }) => enfant),
      )
    }
    currentLevel = nextLevel
  }

  return { allNodes, enfantsByParent }
}

export const loadFonctionsAgregation = async (
  indicateurId: string,
): Promise<Map<string, FonctionAgregation>> => {
  const indicateurReferentiels = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
  })
  return new Map(
    indicateurReferentiels.map((indicateurReferentiel) => [
      indicateurReferentiel.referentielId,
      indicateurReferentiel.fonctionAgregation,
    ]),
  )
}
