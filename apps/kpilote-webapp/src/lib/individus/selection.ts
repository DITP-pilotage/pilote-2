import { uniq } from 'es-toolkit'

import {
  findRootReferentielIdForIndividu,
  type IndividuNode,
  pickRoot,
  type ReferentielGroup,
} from '@/lib/individus/hierarchy'

// Sélection d'individus de l'accueil : au plus un individu par stack de
// référentiels (un stack = un référentiel racine et son sous-arbre, voir
// groupNodesByRootReferentiel). Dans l'URL : `?individus=DEPT-84,BV-05`.
// Sélection vide : chaque indicateur se lit sur son individu racine (API).

export const parseIndividusParam = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

export const serializeIndividusParam = (individus: ReadonlyArray<string>): string | undefined =>
  individus.length > 0 ? individus.join(',') : undefined

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
    const individusDuStack = new Set(group.nodes.map((node) => node.individu.id))
    const choisi = individus.find((individu) => individusDuStack.has(individu))
    return choisi ? [choisi] : []
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
  const autresStacks = selection.filter(
    (selectionne) => findRootReferentielIdForIndividu(groups, selectionne) !== stack,
  )
  return normalizeSelection({ individus: [individu, ...autresStacks], groups })
}

// Search d'un lien vers une fiche (indicateur ou collection) : l'individu sur
// lequel l'ouvrir, et la sélection du tableau de bord, que la fiche rend par son
// lien de retour.
export type LienFiche = { individu?: string; referentiel?: string; individus?: string }

export type Lecture = {
  // Individus à transmettre à l'API ; undefined pour lire les individus racines.
  individus: ReadonlyArray<string> | undefined
  lien: LienFiche
  // Une sélection existe mais aucun de ses individus ne concerne l'indicateur.
  indisponible: boolean
}

const toLien = ({
  individuOuvert,
  selection,
}: {
  individuOuvert: IndividuNode | undefined
  selection: ReadonlyArray<string>
}): LienFiche => {
  const individus = serializeIndividusParam(selection)
  return {
    ...(individuOuvert
      ? { individu: individuOuvert.individu.id, referentiel: individuOuvert.referentiel.id }
      : {}),
    ...(individus ? { individus } : {}),
  }
}

// Même règle que l'API : l'indicateur se lit sur le premier individu
// sélectionné dont le référentiel lui est lié, sans remonter vers un ancêtre.
export const resolveLectureIndicateur = ({
  selection,
  nodes,
  referentielIds,
}: {
  selection: ReadonlyArray<string>
  nodes: ReadonlyArray<IndividuNode>
  referentielIds: ReadonlyArray<string>
}): Lecture => {
  if (selection.length === 0) return { individus: undefined, lien: {}, indisponible: false }

  const referentielsLies = new Set(referentielIds)
  const individuLu = selection
    .map((individu) => nodes.find((node) => node.individu.id === individu))
    .find((node) => node !== undefined && referentielsLies.has(node.referentiel.id))
  return {
    individus: selection,
    lien: toLien({ individuOuvert: individuLu, selection }),
    indisponible: individuLu === undefined,
  }
}

// Une collection se lit sur toute la sélection. Sa fiche ne prend qu'un
// individu, et la carte ne connaît pas les référentiels de ses indicateurs : le
// lien ne transmet que la sélection, la fiche choisit son individu par défaut.
export const resolveLectureCollection = ({
  selection,
}: {
  selection: ReadonlyArray<string>
}): Lecture => ({
  individus: selection.length > 0 ? selection : undefined,
  lien: toLien({ individuOuvert: undefined, selection }),
  indisponible: false,
})

export type Selecteur = {
  group: ReferentielGroup
  referentielIds: string[]
  value: string
  placeholder: string
}

// Un sélecteur par stack. Sans sélection, chaque sélecteur annonce sa racine
// comme valeur par défaut ; dès qu'un individu est choisi, les stacks sans
// sélection n'ont plus de défaut.
export const buildSelecteurs = ({
  groups,
  selection,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  selection: ReadonlyArray<string>
}): Selecteur[] =>
  groups.map((group) => {
    const choisi = group.nodes.find((node) => selection.includes(node.individu.id))
    const racine = pickRoot(group.nodes)
    const placeholder =
      selection.length === 0 && racine ? `${racine.individu.nom} (par défaut)` : 'Aucune sélection'
    return {
      group,
      referentielIds: uniq(group.nodes.map((node) => node.referentiel.id)),
      value: choisi?.individu.id ?? '',
      placeholder,
    }
  })
