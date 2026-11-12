import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AxeForm, type AxeFormValues } from '@/components/AxeForm'

const renderForm = ({ mode, initial }: { mode: 'create' | 'edit'; initial: AxeFormValues }) => {
  const onSubmit = vi.fn()
  render(
    <AxeForm
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

describe('AxeForm', () => {
  it("crée un axe : l'identifiant passe en majuscules et les niveaux partent en { nom }", async () => {
    const { onSubmit, submit } = renderForm({
      mode: 'create',
      initial: { id: '', nom: '', description: '', niveaux: [{ nom: '' }] },
    })
    expect(submit).toBeDisabled()

    await saisir('Identifiant', 'axe-test')
    await saisir('Nom *', 'Test')
    await saisir('Nom du niveau 1', 'Famille')
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un niveau/ }))
    await saisir('Nom du niveau 2', 'Type')

    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      id: 'AXE-TEST',
      nom: 'Test',
      description: '',
      niveaux: [{ nom: 'Famille' }, { nom: 'Type' }],
    })
  })

  it("signale un identifiant mal formé et bloque l'envoi", async () => {
    const { submit } = renderForm({
      mode: 'create',
      initial: { id: '', nom: 'Test', description: '', niveaux: [{ nom: 'Famille' }] },
    })

    await saisir('Identifiant', 'OPERATEUR')

    expect(await screen.findByText(/format AXE-<SLUG>/)).toBeInTheDocument()
    expect(submit).toBeDisabled()
  })

  it('bloque l’envoi tant qu’un niveau ajouté est vide', async () => {
    const { submit } = renderForm({
      mode: 'edit',
      initial: { id: 'AXE-X', nom: 'X', description: '', niveaux: [{ nom: 'Famille' }] },
    })
    await waitFor(() => expect(submit).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: /Ajouter un niveau/ }))

    await waitFor(() => expect(submit).toBeDisabled())
  })

  it('ne permet de retirer que le dernier niveau', async () => {
    const { onSubmit, submit } = renderForm({
      mode: 'edit',
      initial: {
        id: 'AXE-X',
        nom: 'X',
        description: '',
        niveaux: [{ nom: 'Famille' }, { nom: 'Type' }],
      },
    })

    expect(screen.queryByRole('button', { name: 'Retirer le niveau 1' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retirer le niveau 2' }))
    expect(screen.queryByLabelText('Nom du niveau 2')).not.toBeInTheDocument()
    // Il ne reste qu'un niveau : il n'est plus retirable.
    expect(screen.queryByRole('button', { name: /Retirer le niveau/ })).not.toBeInTheDocument()

    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ niveaux: [{ nom: 'Famille' }] })
  })
})
