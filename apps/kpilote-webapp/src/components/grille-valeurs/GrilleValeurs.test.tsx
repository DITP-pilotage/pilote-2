import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Sparkles } from 'lucide-react'
import { type ReactNode } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { GrilleValeurs } from '@/components/grille-valeurs/GrilleValeurs'
import {
  type CelluleGrille,
  type ColonneGrille,
  type LigneGrille,
  type PositionCellule,
} from '@/lib/grilleValeurs'

const COLONNES: ColonneGrille[] = [
  { type: 'INDIVIDU', label: 'Individu' },
  { type: 'AXE', label: 'Opérateur', axe: 'AXE-OPERATEUR', rang: 0 },
]

const buildCellule = (overrides: Partial<CelluleGrille> = {}): CelluleGrille => ({
  text: '',
  identifiant: null,
  tone: 'DEFAULT',
  marker: null,
  alignRight: false,
  isEditable: true,
  ...overrides,
})

const LIGNES: LigneGrille[] = [
  {
    index: 0,
    numero: 1,
    cellules: [buildCellule({ text: 'Vaucluse' }), buildCellule({ text: 'Orange' })],
  },
  {
    index: 1,
    numero: 2,
    cellules: [buildCellule({ text: 'Gard' }), buildCellule({ text: 'Free' })],
  },
]

const renderGrille = ({
  lignes = LIGNES,
  selection = { ligne: 0, colonne: 0 },
  onSelect = vi.fn<(position: PositionCellule) => void>(),
  editor = null,
  onEdit,
  onCloseEditor = vi.fn<() => void>(),
}: {
  lignes?: LigneGrille[]
  selection?: PositionCellule
  onSelect?: (position: PositionCellule) => void
  editor?: ReactNode
  onEdit?: (position: PositionCellule) => void
  onCloseEditor?: () => void
} = {}) =>
  render(
    <GrilleValeurs
      label="Valeurs"
      colonnes={COLONNES}
      lignes={lignes}
      selection={selection}
      onSelect={onSelect}
      editor={editor}
      // Sans `onEdit`, la grille est en lecture seule.
      {...(onEdit ? { onEdit } : {})}
      onCloseEditor={onCloseEditor}
      emptyMessage="Aucune valeur."
    />,
  )

const entetes = () => screen.getAllByRole('columnheader').map((cellule) => cellule.textContent)

const pressedCellules = () =>
  screen.queryAllByRole('button').filter((button) => button.getAttribute('aria-pressed') === 'true')

beforeAll(() => {
  // jsdom n'implémente pas le défilement.
  Element.prototype.scrollIntoView = vi.fn()
})

describe('GrilleValeurs', () => {
  it('affiche une colonne par entrée, et le badge « Axe » sur les colonnes d’axe', () => {
    renderGrille()

    expect(entetes()).toEqual(['Ligne', 'Individu', 'OpérateurAxe'])
  })

  it('affiche le numéro de chaque ligne et le texte de ses cellules', () => {
    renderGrille()

    const enTetesDeLigne = screen.getAllByRole('rowheader').map((cellule) => cellule.textContent)
    expect(enTetesDeLigne).toEqual(['1', '2'])
    expect(screen.getByRole('button', { name: 'Vaucluse' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Free' })).toBeInTheDocument()
  })

  it('donne au repère son libellé accessible', () => {
    renderGrille({
      lignes: [
        {
          index: 0,
          numero: 1,
          cellules: [
            buildCellule({ text: 'Vaucluse', marker: { icon: Sparkles, label: 'Repère de test' } }),
            buildCellule({ text: 'Orange' }),
          ],
        },
      ],
    })

    expect(screen.getByLabelText('Repère de test')).toBeInTheDocument()
  })

  it('signale la cellule sélectionnée', () => {
    renderGrille({ selection: { ligne: 1, colonne: 0 } })

    expect(pressedCellules()).toEqual([screen.getByRole('button', { name: 'Gard' })])
  })

  it('appelle onSelect au clic, avec la position de la cellule', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ onSelect })

    await userEvent.click(screen.getByRole('button', { name: 'Free' }))

    expect(onSelect).toHaveBeenCalledWith({ ligne: 1, colonne: 1 })
  })

  it('déplace la sélection avec les flèches', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ selection: { ligne: 0, colonne: 0 }, onSelect })

    screen.getByRole('button', { name: 'Vaucluse' }).focus()
    await userEvent.keyboard('{ArrowDown}')

    expect(onSelect).toHaveBeenCalledWith({ ligne: 1, colonne: 0 })
  })

  it('une flèche ne sélectionne qu’une fois', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ selection: { ligne: 0, colonne: 0 }, onSelect })

    screen.getByRole('button', { name: 'Vaucluse' }).focus()
    await userEvent.keyboard('{ArrowDown}')

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith({ ligne: 1, colonne: 0 })
  })

  it('fait de la cellule sélectionnée le seul arrêt de tabulation', () => {
    renderGrille({ selection: { ligne: 1, colonne: 0 } })

    const tabStops = screen.getAllByRole('button').filter((button) => button.tabIndex === 0)
    expect(tabStops).toEqual([screen.getByRole('button', { name: 'Gard' })])
  })

  it('sans sélection, la tabulation entre dans la grille par la première cellule et la sélectionne', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ selection: { ligne: -1, colonne: 0 }, onSelect })

    await userEvent.tab()

    expect(screen.getByRole('button', { name: 'Vaucluse' })).toHaveFocus()
    expect(onSelect).toHaveBeenCalledWith({ ligne: 0, colonne: 0 })
  })

  it('utilise l’index de la ligne, pas son rang', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({
      lignes: LIGNES.map((ligne, rang) => ({ ...ligne, index: rang === 0 ? 4 : 9 })),
      selection: { ligne: 4, colonne: 0 },
      onSelect,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Free' }))

    expect(onSelect).toHaveBeenCalledWith({ ligne: 9, colonne: 1 })
  })

  it('affiche emptyMessage quand il n’y a aucune ligne', () => {
    renderGrille({ lignes: [] })

    expect(screen.getByText('Aucune valeur.')).toBeInTheDocument()
  })

  it('ne sélectionne aucune cellule quand la sélection est hors des lignes', () => {
    renderGrille({ selection: { ligne: -1, colonne: 0 } })

    expect(pressedCellules()).toEqual([])
  })
})

describe('GrilleValeurs, édition', () => {
  const LIGNES_EDITABLES: LigneGrille[] = [
    {
      index: 0,
      numero: 1,
      cellules: [
        buildCellule({ text: 'Vaucluse' }),
        buildCellule({ text: 'Orange', isEditable: false }),
      ],
    },
    {
      index: 1,
      numero: 2,
      cellules: [buildCellule({ text: 'Gard' }), buildCellule({ text: 'Free' })],
    },
  ]

  it('double-cliquer une cellule éditable demande son édition', async () => {
    const onEdit = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ lignes: LIGNES_EDITABLES, onEdit })

    await userEvent.dblClick(screen.getByRole('button', { name: 'Free' }))

    expect(onEdit).toHaveBeenCalledWith({ ligne: 1, colonne: 1 })
  })

  it('double-cliquer une cellule non éditable ne demande rien', async () => {
    const onEdit = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ lignes: LIGNES_EDITABLES, onEdit })

    await userEvent.dblClick(screen.getByRole('button', { name: 'Orange' }))

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('Entrée et F2 demandent l’édition de la cellule sélectionnée', async () => {
    const onEdit = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ lignes: LIGNES_EDITABLES, selection: { ligne: 1, colonne: 0 }, onEdit })

    screen.getByRole('button', { name: 'Gard' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{F2}')

    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenNthCalledWith(1, { ligne: 1, colonne: 0 })
    expect(onEdit).toHaveBeenNthCalledWith(2, { ligne: 1, colonne: 0 })
  })

  it('Entrée et F2 ne demandent rien sur une cellule non éditable', async () => {
    const onEdit = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ lignes: LIGNES_EDITABLES, selection: { ligne: 0, colonne: 1 }, onEdit })

    screen.getByRole('button', { name: 'Orange' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{F2}')

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('sans onEdit, la grille reste en lecture seule', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({ lignes: LIGNES_EDITABLES, selection: { ligne: 1, colonne: 0 }, onSelect })

    await userEvent.dblClick(screen.getByRole('button', { name: 'Gard' }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{F2}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onSelect).toHaveBeenCalledWith({ ligne: 1, colonne: 0 })
  })

  it('distingue au curseur une cellule éditable d’une cellule non éditable', () => {
    renderGrille({ lignes: LIGNES_EDITABLES, onEdit: vi.fn() })

    expect(screen.getByRole('button', { name: 'Vaucluse' })).toHaveClass('cursor-cell')
    expect(screen.getByRole('button', { name: 'Orange' })).toHaveClass('cursor-default')
  })

  it('affiche l’éditeur fourni, ancré à la cellule sélectionnée', () => {
    renderGrille({
      lignes: LIGNES_EDITABLES,
      selection: { ligne: 1, colonne: 1 },
      editor: <p>Éditeur de test</p>,
      onEdit: vi.fn(),
    })

    expect(screen.getByText('Éditeur de test')).toBeInTheDocument()
  })

  it('Échap ferme l’éditeur', async () => {
    const onCloseEditor = vi.fn<() => void>()
    renderGrille({
      lignes: LIGNES_EDITABLES,
      selection: { ligne: 1, colonne: 1 },
      editor: <p>Éditeur de test</p>,
      onEdit: vi.fn(),
      onCloseEditor,
    })

    await userEvent.keyboard('{Escape}')

    expect(onCloseEditor).toHaveBeenCalled()
  })

  it('les flèches ne bougent pas la sélection pendant l’édition', async () => {
    const onSelect = vi.fn<(position: PositionCellule) => void>()
    renderGrille({
      lignes: LIGNES_EDITABLES,
      selection: { ligne: 0, colonne: 0 },
      onSelect,
      editor: <input aria-label="Champ de test" />,
      onEdit: vi.fn(),
    })

    screen.getByRole('textbox', { name: 'Champ de test' }).focus()
    await userEvent.keyboard('{ArrowDown}')

    expect(onSelect).not.toHaveBeenCalled()
  })
})
