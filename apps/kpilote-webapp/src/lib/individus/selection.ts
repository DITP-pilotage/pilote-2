import { joinCsv } from '@pilote/kpilote-shared/texte'
import { uniq } from 'es-toolkit'

import {
  findRootReferentielIdForIndividu,
  type IndividuNode,
  pickRoot,
  type ReferentielGroup,
} from '@/lib/individus/hierarchy'

// Sélection d'individus de l'accueil : au plus un individu par stack de
// référentiels (un stack = un référentiel racine et son sous-arbre, voir
// groupNodesByRootReferentiel). Dans l'URL : `?selectedIndividus=DEPT-84,BV-05`, lue par
// splitCsv et écrite par joinCsv.
// Sélection vide : chaque indicateur se lit sur son individu racine (API).

// Garde le premier individu connu de chaque stack, dans l'ordre des stacks. Un
// individu absent de la hiérarchie est ignoré.
export const normalizeSelection = ({
  individus,
  groups,
}: {
  individus: ReadonlyArray<string>
  groups: ReadonlyArray<ReferentielGroup>
}): string[] =>
  groups.flatMap((group) => {
    const stackIndividuIds = new Set(group.nodes.map((node) => node.individu.id))
    const chosen = individus.find((individu) => stackIndividuIds.has(individu))
    return chosen ? [chosen] : []
  })

// Choisir un individu remplace la sélection de son stack et garde celle des autres.
export const selectIndividu = ({
  selection,
  groups,
  individu,
}: {
  selection: ReadonlyArray<string>
  groups: ReadonlyArray<ReferentielGroup>
  individu: string
}): string[] => {
  const stack = findRootReferentielIdForIndividu(groups, individu)
  const otherStacks = selection.filter(
    (selected) => findRootReferentielIdForIndividu(groups, selected) !== stack,
  )
  return normalizeSelection({ individus: [individu, ...otherStacks], groups })
}

// Retirer un individu libère son stack ; une sélection vidée revient aux racines.
export const removeIndividu = ({
  selection,
  individu,
}: {
  selection: ReadonlyArray<string>
  individu: string
}): string[] => selection.filter((selected) => selected !== individu)

// Search d'un lien vers une fiche (indicateur ou collection) : l'individu sur
// lequel l'ouvrir, et la sélection du tableau de bord, que la fiche rend par son
// lien de retour.
export type FicheLink = { individu?: string; referentiel?: string; selectedIndividus?: string }

export type CardReading = {
  // Individus à transmettre à l'API ; undefined pour lire les individus racines.
  individus: ReadonlyArray<string> | undefined
  link: FicheLink
  // Une sélection existe mais aucun de ses individus ne concerne l'indicateur.
  isUnavailable: boolean
}

const toFicheLink = ({
  openedIndividu,
  selection,
}: {
  openedIndividu: IndividuNode | undefined
  selection: ReadonlyArray<string>
}): FicheLink => {
  const selectedIndividus = joinCsv(selection)
  return {
    ...(openedIndividu
      ? { individu: openedIndividu.individu.id, referentiel: openedIndividu.referentiel.id }
      : {}),
    ...(selectedIndividus ? { selectedIndividus } : {}),
  }
}

// Même règle que l'API : l'indicateur se lit sur le premier individu
// sélectionné dont le référentiel lui est lié, sans remonter vers un ancêtre.
export const resolveIndicateurReading = ({
  selection,
  nodes,
  referentielIds,
}: {
  selection: ReadonlyArray<string>
  nodes: ReadonlyArray<IndividuNode>
  referentielIds: ReadonlyArray<string>
}): CardReading => {
  if (selection.length === 0) return { individus: undefined, link: {}, isUnavailable: false }

  const linkedReferentielIds = new Set(referentielIds)
  const readIndividu = selection
    .map((individu) => nodes.find((node) => node.individu.id === individu))
    .find((node) => node !== undefined && linkedReferentielIds.has(node.referentiel.id))
  return {
    individus: selection,
    link: toFicheLink({ openedIndividu: readIndividu, selection }),
    isUnavailable: readIndividu === undefined,
  }
}

// Une collection se lit sur toute la sélection. Sa fiche ne prend qu'un
// individu, et la carte ne connaît pas les référentiels de ses indicateurs : le
// lien ne transmet que la sélection, la fiche choisit son individu par défaut.
export const resolveCollectionReading = ({
  selection,
}: {
  selection: ReadonlyArray<string>
}): CardReading => ({
  individus: selection.length > 0 ? selection : undefined,
  link: toFicheLink({ openedIndividu: undefined, selection }),
  isUnavailable: false,
})

export type Selector = {
  group: ReferentielGroup
  referentielIds: string[]
  value: string
  placeholder: string
}

// Un sélecteur par stack. Sans sélection, chaque sélecteur annonce sa racine
// comme valeur par défaut ; dès qu'un individu est choisi, les stacks sans
// sélection n'ont plus de défaut.
export const buildSelectors = ({
  groups,
  selection,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  selection: ReadonlyArray<string>
}): Selector[] =>
  groups.map((group) => {
    const chosen = group.nodes.find((node) => selection.includes(node.individu.id))
    const root = pickRoot(group.nodes)
    const placeholder =
      selection.length === 0 && root ? `${root.individu.nom} (par défaut)` : 'Aucune sélection'
    return {
      group,
      referentielIds: uniq(group.nodes.map((node) => node.referentiel.id)),
      value: chosen?.individu.id ?? '',
      placeholder,
    }
  })

// Individu d'une lecture qui concerne l'indicateur, connu même sans valeur. Une
// collection transmet son individu à toutes ses cartes : il ne vaut que pour les
// indicateurs liés à son référentiel.
export const findReadIndividu = ({
  reading,
  referentielIds,
}: {
  reading: CardReading
  referentielIds: ReadonlyArray<string>
}): string | undefined => {
  const { individu, referentiel } = reading.link
  if (!individu || !referentiel) return undefined
  return referentielIds.includes(referentiel) ? individu : undefined
}
