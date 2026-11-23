import { depthFirst } from '@pilote/kpilote-shared/modaliteTree'
import { type CombinaisonIds } from '@pilote/kpilote-shared/valeursCombinaison'
import { sortBy } from 'es-toolkit'

import { type TableauValeursContext } from '@/lib/axes/tableauValeurs'
import { type ColonneGrille, formatDate, formatValeur, type LigneGrille } from '@/lib/grilleValeurs'

// La cellule du tableau croisé qu'une ligne représente : sa combinaison et sa date.
export type LigneCible = { ids: CombinaisonIds; periode: string }

export type LignesValeurs = {
  colonnes: ColonneGrille[]
  lignes: LigneGrille[]
  // `cibles[ligne.index]` : la cellule de la ligne, pour l'expliquer dans la barre de formule.
  cibles: LigneCible[]
}

const entiteCellule = ({ id, nom }: { id: string; nom: string }) => ({
  text: nom,
  identifiant: id,
  isAlbert: false,
  isWarning: false,
  alignRight: false,
  isCalculee: false,
})

// Le cube d'un individu décomposé en lignes, au format de l'import : une ligne par combinaison
// de modalités feuilles et par date où l'API a un point, dans l'ordre des axes.
export const buildLignesValeurs = ({
  context,
  individu,
}: {
  context: TableauValeursContext
  individu: { id: string; nom: string }
}): LignesValeurs => {
  const { axes, series } = context
  const rankByFeuilleByAxe = axes.map(
    (axe) =>
      new Map(
        depthFirst({ tree: axe.tree })
          .filter((node) => node.kind === 'feuille')
          .map((node, rank) => [node.id, rank] as const),
      ),
  )
  const points = [...series.values()].flatMap(({ ids, valeurs }) => {
    const ranks = ids.map((id, index) => rankByFeuilleByAxe[index]?.get(id))
    if (ranks.some((rank) => rank === undefined)) return []
    return valeurs.map((point) => ({ ids, ranks, point }))
  })
  const ordered = sortBy(points, [
    ...axes.map((_, index) => (item: (typeof points)[number]) => item.ranks[index] ?? 0),
    (item) => item.point.date,
  ])

  const colonnes: ColonneGrille[] = [
    { type: 'INDIVIDU', label: 'Individu' },
    ...axes.map((axe, rang): ColonneGrille => ({ type: 'AXE', label: axe.nom, axe: axe.id, rang })),
    { type: 'DATE', label: 'Date' },
    { type: 'VALEUR', label: 'Valeur' },
  ]
  const lignes = ordered.map(({ ids, point }, index): LigneGrille => {
    const isCalculee = point.type === 'derivee'
    return {
      index,
      numero: index + 1,
      isImportable: true,
      cellules: [
        entiteCellule(individu),
        ...ids.map((id, rang) => entiteCellule({ id, nom: axes[rang]?.tree.get(id)?.nom ?? id })),
        { ...entiteCellule({ id: '', nom: formatDate(point.date) }), identifiant: null },
        {
          ...entiteCellule({ id: '', nom: formatValeur(point.valeur) }),
          identifiant: null,
          alignRight: true,
          isCalculee,
        },
      ],
    }
  })
  return {
    colonnes,
    lignes,
    cibles: ordered.map(({ ids, point }) => ({ ids, periode: point.date })),
  }
}
