import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { cleCellule } from '@/valeurAvancement/cellule'
import {
  type AgregationNoeud,
  type GrapheSerie,
  type IndividuRef,
  type Noeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Graphe d'un indicateur sans axe : un nœud par individu, sur une seule
// combinaison. Un individu est agrégé s'il a des enfants et que la fonction de
// son référentiel n'est pas NONE (`getFonctionAgregationActive`) ; sinon il est
// saisi. C'est le calcul historique, extrait du moteur.
export const buildGrapheTerritoire = ({
  individus,
  enfantsParParent,
  fonctionAgregationParReferentiel,
  saisiesParIndividu,
  combinaisonId,
}: {
  individus: Iterable<IndividuRef>
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  saisiesParIndividu: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
  combinaisonId: string
}): { graphe: GrapheSerie; noeud: (individu: IndividuRef) => Noeud } => {
  const noeud = (individu: IndividuRef): Noeud => ({
    cle: cleCellule({ individuId: individu.id, combinaisonId }),
    individuPublicId: individu.publicId,
    modalites: [],
  })

  const liste = [...individus]
  const referentielParIndividu = new Map(liste.map((i) => [i.id, i.referentielId]))
  const territoire = { enfantsParParent, fonctionAgregationParReferentiel, referentielParIndividu }

  const agregationParNoeud = new Map<string, AgregationNoeud>()
  const saisiesParNoeud = new Map<string, ReadonlyArray<SaisieTronquee>>()
  for (const individu of liste) {
    const fonction = getFonctionAgregationActive(individu.id, territoire)
    if (fonction) {
      const enfants = enfantsParParent.get(individu.id) ?? []
      agregationParNoeud.set(noeud(individu).cle, { fonction, enfants: enfants.map(noeud) })
    } else {
      const saisies = saisiesParIndividu.get(individu.id)
      if (saisies) saisiesParNoeud.set(noeud(individu).cle, saisies)
    }
  }

  return { graphe: { agregationParNoeud, saisiesParNoeud }, noeud }
}
