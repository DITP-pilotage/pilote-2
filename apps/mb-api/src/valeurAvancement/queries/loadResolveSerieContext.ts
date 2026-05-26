import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'
import { type DateTrunc } from '@pilote/mb-shared/valeurAvancement'

import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  type IndividuRef,
  type ResolveSerieContext,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Charge en bulk tout ce dont `resolveSerieIndividu` a besoin pour calculer
// une série (dérivée ou feuille) à partir d'un ensemble d'individus cibles :
// le sous-arbre des descendants, les liens indicateur↔référentiel, et les
// saisies tronquées pré-dédoublonnées par bucket (cf. design doc
// `indicateur-derives.md`). Le travail DB est concentré ici pour que le
// functional core reste pur et mémoïsable côté appelant.
export const loadResolveSerieContext = async ({
  indicateurId,
  cibles,
  dateTrunc,
}: {
  indicateurId: string
  cibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
}): Promise<{ ctx: ResolveSerieContext; allNodes: Map<string, IndividuRef> }> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(cibles),
    loadFonctionsAgregation(indicateurId),
  ])
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
  return { ctx, allNodes }
}

// BFS itératif niveau par niveau plutôt qu'une CTE récursive PostgreSQL :
// l'arbre est typiquement peu profond (3-4 niveaux France→Région→Département)
// et garder le calcul en JS reste plus simple à lire et à débugger que du SQL
// récursif. Détection naïve des cycles : on ne retraite pas un nœud déjà vu.
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

const loadSaisiesTronquees = async ({
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
