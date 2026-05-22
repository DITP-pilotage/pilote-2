import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'
import { type DateTrunc } from '@pilote/mb-shared/valeurAvancement'

import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import { type IndividuRef, type SaisieTronquee } from '@/valeurAvancement/resolveSerieDerivee'

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
    select: { referentielId: true, fonctionAgregation: true },
  })
  return new Map(liens.map((lien) => [lien.referentielId, lien.fonctionAgregation]))
}

export const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
}): Promise<Map<string, SaisieTronquee[]>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(indicateurId, [...individuIds], dateTrunc),
  )
  const serieFeuilleParIndividu = new Map<string, SaisieTronquee[]>()
  for (const row of rows) {
    if (!row.bucket) continue
    const liste = serieFeuilleParIndividu.get(row.individuId) ?? []
    liste.push({ bucket: row.bucket, dateOrigine: row.dateOrigine, valeur: row.valeur })
    serieFeuilleParIndividu.set(row.individuId, liste)
  }
  return serieFeuilleParIndividu
}
