import { db } from '@/framework/persistence/dbStore'

// Ancêtres (toute profondeur) des individus donnés, en remontant `Relation`
// dans une seule dimension. Les individus de départ ne sont pas inclus, sauf
// s'ils sont aussi l'ancêtre d'un autre. Le Set de visités protège des cycles
// déjà présents en base.
export const loadAncetres = async ({
  individuIds,
  dimensionId,
}: {
  individuIds: ReadonlyArray<string>
  dimensionId: string
}): Promise<Set<string>> => {
  const ancetres = new Set<string>()
  const visites = new Set<string>(individuIds)
  let courant = [...individuIds]

  while (courant.length > 0) {
    const relations = await db().relation.findMany({
      where: { childId: { in: courant }, parent: { referentiel: { dimensionId } } },
      select: { parentId: true },
    })
    for (const { parentId } of relations) ancetres.add(parentId)
    courant = [...new Set(relations.map((relation) => relation.parentId))].filter(
      (id) => !visites.has(id),
    )
    for (const id of courant) visites.add(id)
  }

  return ancetres
}
