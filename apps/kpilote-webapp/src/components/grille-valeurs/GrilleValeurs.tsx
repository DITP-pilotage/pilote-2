import { type KeyboardEvent, type ReactNode, useEffect } from 'react'

import { clsxm } from '@/lib/clsxm'

import { ColonneEntete } from '@/components/grille-valeurs/ColonneEntete'
import { GrilleLigne } from '@/components/grille-valeurs/GrilleLigne'
import {
  cellDomId,
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

const noop = () => undefined

// Une ligne par valeur, une cellule sélectionnée que le clavier déplace. Sans `onEdit`, la
// grille est en lecture seule.
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
  // L'éditeur ouvert sur la cellule sélectionnée, ou `null`.
  editor?: ReactNode
  onEdit?: (position: PositionCellule) => void
  onCloseEditor?: () => void
  emptyMessage: string
  // Sans cadre : la grille occupe tout son conteneur, comme le tableau croisé.
  isFramed?: boolean
}) {
  const isEditing = editor !== null

  // La cellule sélectionnée porte le focus : le clavier la suit dans la grille.
  useEffect(() => {
    if (isEditing) return
    const cellule = document.getElementById(cellDomId(selection))
    cellule?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selection, isEditing])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return
    const delta = DELTA_BY_KEY[event.key]
    if (delta) {
      event.preventDefault()
      const next = movePosition({
        position: selection,
        delta,
        lignes,
        nombreColonnes: colonnes.length,
      })
      onSelect(next)
      document.getElementById(cellDomId(next))?.focus()
      return
    }
    const opensEditor = event.key === 'Enter' || event.key === 'F2'
    if (opensEditor && onEdit) {
      event.preventDefault()
      onEdit(selection)
    }
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
                ligne={ligne}
                selectedColonne={isSelectedLigne ? selection.colonne : null}
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
