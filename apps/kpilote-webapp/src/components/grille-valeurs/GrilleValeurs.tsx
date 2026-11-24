import { type KeyboardEvent, type ReactNode, useEffect, useId } from 'react'

import { ColonneEntete } from '@/components/grille-valeurs/ColonneEntete'
import { GrilleLigne } from '@/components/grille-valeurs/GrilleLigne'
import { clsxm } from '@/lib/clsxm'
import {
  cellDomId,
  type CelluleGrille,
  type ColonneGrille,
  type LigneGrille,
  movePosition,
  type PositionCellule,
} from '@/lib/grilleValeurs'

// Les colonnes d'axe se partagent la place laissée par les autres.
const COLUMN_WIDTH: Record<ColonneGrille['type'], string | undefined> = {
  INDIVIDU: 'w-[26%]',
  AXE: undefined,
  DATE: 'w-32',
  VALEUR: 'w-32',
}

const DELTA_BY_KEY: Record<string, { ligne: number; colonne: number }> = {
  ArrowUp: { ligne: -1, colonne: 0 },
  ArrowDown: { ligne: 1, colonne: 0 },
  ArrowLeft: { ligne: 0, colonne: -1 },
  ArrowRight: { ligne: 0, colonne: 1 },
}

const EDIT_KEYS: ReadonlyArray<string> = ['Enter', 'F2']

const noop = () => undefined

const findCellule = ({
  lignes,
  position,
}: {
  lignes: ReadonlyArray<LigneGrille>
  position: PositionCellule
}): CelluleGrille | undefined =>
  lignes.find((ligne) => ligne.index === position.ligne)?.cellules[position.colonne]

// La seule cellule atteignable par Tab : la cellule sélectionnée si sa ligne est affichée,
// sinon la première cellule de la première ligne affichée.
const findTabStop = ({
  selection,
  lignes,
}: {
  selection: PositionCellule
  lignes: ReadonlyArray<LigneGrille>
}): PositionCellule | null => {
  const isSelectionAffichee = lignes.some((ligne) => ligne.index === selection.ligne)
  if (isSelectionAffichee) return selection
  const premiereLigne = lignes[0]
  if (premiereLigne === undefined) return null
  return { ligne: premiereLigne.index, colonne: 0 }
}

// Une ligne par valeur, avec une cellule sélectionnée que le clavier déplace. La grille demande
// l'édition d'une cellule éditable et affiche l'éditeur qu'on lui donne : ce que veut dire
// corriger appartient à l'écran. Sans `onEdit`, elle est en lecture seule.
export function GrilleValeurs({
  label,
  colonnes,
  lignes,
  selection,
  onSelect,
  editor = null,
  onEdit,
  onCloseEditor = noop,
  emptyMessage,
  isFramed = true,
}: {
  label: string
  colonnes: ReadonlyArray<ColonneGrille>
  lignes: ReadonlyArray<LigneGrille>
  selection: PositionCellule
  onSelect: (position: PositionCellule) => void
  // Éditeur ouvert sur la cellule sélectionnée, ou `null`.
  editor?: ReactNode
  // Absent : la grille est en lecture seule.
  onEdit?: (position: PositionCellule) => void
  onCloseEditor?: () => void
  emptyMessage: string
  // Sans cadre : la grille occupe tout son conteneur.
  isFramed?: boolean
}) {
  // Deux grilles d'une même page n'ont pas d'`id` de cellule en commun.
  const gridId = useId()
  // Calculé depuis la sélection courante : la cellule qu'une flèche atteint n'est pas encore
  // l'arrêt de tabulation quand elle reçoit le focus, donc son `onFocus` ne sélectionne pas
  // une seconde fois.
  const tabStop = findTabStop({ selection, lignes })
  const isEditing = editor !== null

  // La cellule sélectionnée reste visible quand la sélection change.
  useEffect(() => {
    const cellule = document.getElementById(cellDomId({ gridId, position: selection }))
    cellule?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [gridId, selection])

  const editSelection = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onEdit) return
    if (!findCellule({ lignes, position: selection })?.isEditable) return
    event.preventDefault()
    onEdit(selection)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Le clavier appartient à l'éditeur (liste de candidats, champ texte) : ses événements
    // remontent jusqu'ici à travers le portail du popover.
    if (isEditing) return
    if (EDIT_KEYS.includes(event.key)) return editSelection(event)
    const delta = DELTA_BY_KEY[event.key]
    if (!delta) return
    event.preventDefault()
    const next = movePosition({
      position: selection,
      delta,
      lignes,
      nombreColonnes: colonnes.length,
    })
    onSelect(next)
    // La cellule sélectionnée porte le focus : le clavier la suit dans la grille.
    document.getElementById(cellDomId({ gridId, position: next }))?.focus()
  }

  return (
    <div
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={clsxm(
        'min-h-0 flex-1 overflow-auto',
        isFramed ? 'rounded-b-lg border border-border-strong bg-surface-muted' : 'bg-surface',
      )}
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="w-12" />
          {colonnes.map((colonne, index) => (
            <col key={index} className={COLUMN_WIDTH[colonne.type]} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 z-[2] border-b border-r border-border-strong bg-surface-muted"
            >
              <span className="sr-only">Ligne</span>
            </th>
            {colonnes.map((colonne, index) => (
              <ColonneEntete key={index} colonne={colonne} />
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => {
            const isSelectedLigne = ligne.index === selection.ligne
            return (
              <GrilleLigne
                key={ligne.index}
                gridId={gridId}
                ligne={ligne}
                selectedColonne={isSelectedLigne ? selection.colonne : null}
                tabStopColonne={ligne.index === tabStop?.ligne ? tabStop.colonne : null}
                editor={isSelectedLigne ? editor : null}
                onSelect={onSelect}
                onEdit={onEdit}
                onCloseEditor={onCloseEditor}
              />
            )
          })}
        </tbody>
      </table>
      {lignes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-text-muted">{emptyMessage}</p>
      ) : null}
    </div>
  )
}
