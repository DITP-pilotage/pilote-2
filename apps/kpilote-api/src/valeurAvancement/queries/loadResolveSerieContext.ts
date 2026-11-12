import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { parseBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesPourIndividus } from '@/generated/prisma/sql'
import {
  loadFonctionsAgregation,
  loadSousArbre,
} from '@/indicateur/queries/loadIndicateurIndividuContext'
import { buildGrapheTerritoire } from '@/valeurAvancement/buildGrapheTerritoire'
import {
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Charge en bulk tout ce dont le moteur (`resolveSerieNoeud`) a besoin pour
// calculer une série (dérivée ou feuille) à partir d'un ensemble d'individus
// cibles : le sous-arbre des descendants, les liens indicateur↔référentiel, et
// les saisies tronquées pré-dédoublonnées par bucket (cf. design doc
// `indicateur-derives.md`), puis construit le graphe de résolution. Le travail
// DB est concentré ici pour que le functional core reste pur et mémoïsable
// côté appelant.
//
// Les saisies chargées sont celles d'une seule combinaison, `combinaisonId`,
// passée explicitement (la combinaison vide pour un indicateur sans axe).
// `noeud` donne le nœud du graphe à résoudre pour un individu cible.
export const loadResolveSerieContext = async ({
  indicateurId,
  individusCibles,
  dateTrunc,
  combinaisonId,
}: {
  indicateurId: string
  individusCibles: ReadonlyArray<IndividuRef>
  dateTrunc: DateTrunc
  combinaisonId: string
}): Promise<{
  graphe: GrapheSerie
  noeud: (individu: IndividuRef) => Noeud
  allNodes: Map<string, IndividuRef>
}> => {
  const [{ allNodes, enfantsParParent }, fonctionAgregationParReferentiel] = await Promise.all([
    loadSousArbre(individusCibles),
    loadFonctionsAgregation(indicateurId),
  ])
  const saisiesParIndividu = await loadSaisiesTronquees({
    indicateurId,
    individuIds: [...allNodes.keys()],
    dateTrunc,
    combinaisonId,
  })

  const { graphe, noeud } = buildGrapheTerritoire({
    individus: allNodes.values(),
    enfantsParParent,
    fonctionAgregationParReferentiel,
    saisiesParIndividu,
    combinaisonId,
  })
  return { graphe, noeud, allNodes }
}

const loadSaisiesTronquees = async ({
  indicateurId,
  individuIds,
  dateTrunc,
  combinaisonId,
}: {
  indicateurId: string
  individuIds: ReadonlyArray<string>
  dateTrunc: DateTrunc
  combinaisonId: string
}): Promise<Map<string, SaisieTronquee[]>> => {
  if (individuIds.length === 0) return new Map()
  const rows = await db().$queryRawTyped(
    getValeursTronqueesPourIndividus(indicateurId, [...individuIds], dateTrunc, combinaisonId),
  )
  const saisiesParIndividu = new Map<string, SaisieTronquee[]>()
  for (const row of rows) {
    if (!row.bucket) continue
    const liste = saisiesParIndividu.get(row.individuId) ?? []
    liste.push({
      bucket: parseBucket(row.bucket),
      dateOrigine: parseBucket(row.dateOrigine),
      valeur: row.valeur,
    })
    saisiesParIndividu.set(row.individuId, liste)
  }
  return saisiesParIndividu
}
