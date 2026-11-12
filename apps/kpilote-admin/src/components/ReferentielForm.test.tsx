import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ReferentielForm, type ReferentielFormValues } from '@/components/ReferentielForm'

const renderForm = ({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial: ReferentielFormValues
}) => {
  const onSubmit = vi.fn()
  render(
    <ReferentielForm
      mode={mode}
      initial={initial}
      pending={false}
      isProd={false}
      onSubmit={onSubmit}
      onCancel={() => {}}
    />,
  )
  return { onSubmit, submit: screen.getByRole('button', { name: 'Enregistrer' }) }
}

// Chaque saisie attend la fin de sa validation asynchrone, comme un utilisateur
// qui remplit les champs l'un après l'autre.
const saisir = (label: string, value: string) =>
  act(() => Promise.resolve(fireEvent.change(screen.getByLabelText(label), { target: { value } })))

describe('ReferentielForm', () => {
  it('crée un référentiel avec ses individus, identifiants passés en majuscules', async () => {
    const { onSubmit, submit } = renderForm({
      mode: 'create',
      initial: { id: '', nom: '', description: '', individus: [] },
    })
    expect(submit).toBeDisabled()

    await saisir('Identifiant', 'ref-dept')
    await saisir('Nom *', 'Départements')
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }))
    await saisir("Identifiant de l'individu 1", 'dept-75')
    await saisir("Nom de l'individu 1", 'Paris')

    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      id: 'REF-DEPT',
      nom: 'Départements',
      description: '',
      individus: [{ publicId: 'DEPT-75', nom: 'Paris' }],
    })
  })

  it("signale un identifiant d'individu mal formé et bloque l'envoi", async () => {
    const { submit } = renderForm({
      mode: 'edit',
      initial: {
        id: 'REF-DEPT',
        nom: 'Départements',
        description: '',
        individus: [{ publicId: 'DEPT-75', nom: 'Paris' }],
      },
    })
    await waitFor(() => expect(submit).toBeEnabled())

    await saisir("Identifiant de l'individu 1", '75')

    expect(await screen.findByText(/Identifiant public d'individu attendu/)).toBeInTheDocument()
    expect(submit).toBeDisabled()
  })

  it('retire un individu', async () => {
    const { onSubmit, submit } = renderForm({
      mode: 'edit',
      initial: {
        id: 'REF-DEPT',
        nom: 'Départements',
        description: '',
        individus: [
          { publicId: 'DEPT-75', nom: 'Paris' },
          { publicId: 'DEPT-13', nom: 'Bouches-du-Rhône' },
        ],
      },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[0]!)

    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      individus: [{ publicId: 'DEPT-13', nom: 'Bouches-du-Rhône' }],
    })
  })
})
