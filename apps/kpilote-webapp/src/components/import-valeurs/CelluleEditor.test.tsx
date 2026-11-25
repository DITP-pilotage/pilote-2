import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { CelluleEditor } from '@/components/import-valeurs/CelluleEditor'
import { type CorrectionSaisie } from '@/components/import-valeurs/edition'
import { type EditionCellule } from '@/components/import-valeurs/grille'

const RAPPROCHEMENT: Extract<EditionCellule, { type: 'RAPPROCHEMENT' }> = {
  type: 'RAPPROCHEMENT',
  cible: { type: 'INDIVIDU' },
  libelle: 'Corse',
  selected: null,
  candidats: [
    { id: 'DEPT-2A', nom: 'Corse-du-Sud' },
    { id: 'DEPT-2B', nom: 'Haute-Corse' },
  ],
  action: 'Choisir un individu',
}

const renderEditor = (edition: EditionCellule) => {
  const onCorrection = vi.fn<(correction: CorrectionSaisie) => void>()
  render(<CelluleEditor edition={edition} onCorrection={onCorrection} />)
  return { onCorrection }
}

beforeAll(() => {
  // jsdom n'implémente ni le défilement ni ResizeObserver, que la liste de candidats utilise.
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

describe('CelluleEditor', () => {
  it('un rapprochement propose les candidats, et le choix d’un candidat envoie RAPPROCHEMENT avec son identifiant', async () => {
    const { onCorrection } = renderEditor(RAPPROCHEMENT)

    expect(screen.getByRole('option', { name: /Corse-du-Sud/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: /Haute-Corse/ }))

    expect(onCorrection).toHaveBeenCalledWith({
      type: 'RAPPROCHEMENT',
      edition: RAPPROCHEMENT,
      publicId: 'DEPT-2B',
    })
  })

  it('une date saisie envoie DATE au format ISO', async () => {
    const { onCorrection } = renderEditor({ type: 'DATE', value: '', action: 'Saisir une date' })

    await userEvent.type(screen.getByLabelText('Date de la valeur'), '2024-03-01')
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))

    expect(onCorrection).toHaveBeenCalledWith({ type: 'DATE', date: '2024-03-01' })
  })

  it('une valeur saisie « 12,4 » envoie VALEUR 12.4', async () => {
    const { onCorrection } = renderEditor({
      type: 'VALEUR',
      value: null,
      action: 'Saisir une valeur',
    })

    await userEvent.type(screen.getByLabelText('Valeur'), '12,4')
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))

    expect(onCorrection).toHaveBeenCalledWith({ type: 'VALEUR', valeur: 12.4 })
  })

  it('une valeur non numérique n’est pas envoyée', async () => {
    const { onCorrection } = renderEditor({
      type: 'VALEUR',
      value: null,
      action: 'Saisir une valeur',
    })

    await userEvent.type(screen.getByLabelText('Valeur'), 'n.d.{Enter}')

    expect(screen.getByText('Ce n’est pas un nombre.')).toBeInTheDocument()
    expect(onCorrection).not.toHaveBeenCalled()
  })

  it('une valeur effacée demande une saisie, sans rien envoyer', async () => {
    const { onCorrection } = renderEditor({ type: 'VALEUR', value: 3.5, action: 'Corriger' })

    await userEvent.clear(screen.getByLabelText('Valeur'))
    await userEvent.type(screen.getByLabelText('Valeur'), '{Enter}')

    expect(screen.getByText('Saisissez une valeur.')).toBeInTheDocument()
    expect(onCorrection).not.toHaveBeenCalled()
  })
})
