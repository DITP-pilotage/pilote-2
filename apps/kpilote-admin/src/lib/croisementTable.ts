import {
  type Arbre,
  type ArbreNode,
  depthFirst,
  formatValue,
  type Kind,
  nodesOfKind,
  TOUS_ID,
} from '@/lib/axeArbre'
import {
  type AxeCroise,
  type CelluleIds,
  countCombinaisons,
  type Layout,
  MAX_COMBINAISONS,
} from '@/lib/axesCroises'

export const rowsOf = ({
  arbre,
  collapsed,
}: {
  arbre: Arbre | undefined
  collapsed: ReadonlySet<string>
}): ArbreNode[] =>
  arbre ? depthFirst({ arbre, id: TOUS_ID, isOpen: (id) => !collapsed.has(id) }) : []

export const firstFeuilleOf = (arbre: Arbre): string | undefined =>
  depthFirst({ arbre, id: TOUS_ID, isOpen: () => true }).find((node) => node.kind === 'feuille')?.id

// Les ids d'une case : la ligne, la colonne (« Tous » sans axe en colonnes), et la modalité
// choisie pour chaque axe fixé.
export const celluleIdsOf = ({
  layout,
  fixedIds,
  row,
  column,
}: {
  layout: Layout
  fixedIds: ReadonlyArray<string>
  row: string
  column: string | undefined
}): CelluleIds =>
  fixedIds.map((fixedId, index) => {
    if (index === layout.rows) return row
    if (index === layout.columns) return column ?? TOUS_ID
    return fixedId
  })

export const referenceOf = ({
  axes,
  ids,
}: {
  axes: ReadonlyArray<AxeCroise>
  ids: CelluleIds
}): string =>
  ids
    .map((id, index) => {
      const axe = axes[index]
      const nom = axe?.arbre.get(id)?.nom ?? id
      return id === TOUS_ID ? nom : `${axe?.nom ?? ''} : ${nom}`
    })
    .join(' × ')

export const warningsOf = (axes: ReadonlyArray<AxeCroise>): string[] => {
  const axeWarnings = axes.flatMap((axe, index) => {
    const feuilleCount = nodesOfKind({ arbre: axe.arbre, kind: 'feuille' }).length
    if (feuilleCount === 0) {
      return [`L’axe ${index + 1} « ${axe.nom} » n’a aucune modalité : rien à saisir.`]
    }
    if (feuilleCount === 1) {
      return [
        `L’axe ${index + 1} « ${axe.nom} » n’a qu’une modalité feuille : le découper ne change aucune valeur, « Tous » vaut cette modalité.`,
      ]
    }
    return []
  })
  const isSampled = countCombinaisons(axes) > MAX_COMBINAISONS
  const sampleWarning = `Plus de ${formatValue(MAX_COMBINAISONS)} combinaisons de feuilles : l’exemple n’en remplit qu’une partie, tirée au hasard.`
  return isSampled ? [...axeWarnings, sampleWarning] : axeWarnings
}

export type Tone = 'active' | 'precedent'

export const toneOf = ({
  key,
  activeKey,
  precedents,
}: {
  key: string
  activeKey: string | null
  precedents: ReadonlySet<string>
}): Tone | undefined => {
  if (key === activeKey) return 'active'
  if (precedents.has(key)) return 'precedent'
  return undefined
}

// 0 : croise deux feuilles ; 1 : une parente ; 2 : « Tous ». Une case blanche se saisit, une
// case teintée se calcule, plus foncée pour la marginale.
export type Emphasis = 0 | 1 | 2

export const emphasisOf = (kind: Kind | undefined): Emphasis => {
  if (kind === 'tous') return 2
  if (kind === 'parente') return 1
  return 0
}

export const strongerEmphasis = ({
  first,
  second,
}: {
  first: Emphasis
  second: Emphasis
}): Emphasis => (first >= second ? first : second)
