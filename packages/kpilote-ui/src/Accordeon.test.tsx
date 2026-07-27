import { render, screen } from '@testing-library/react'
import { Accordeon } from './Accordeon'

it('affiche le titre et le contenu', () => {
  render(
    <Accordeon titre="En savoir plus" defaultOpen>
      Détails ici
    </Accordeon>,
  )
  expect(screen.getByRole('button', { name: /en savoir plus/i })).toBeInTheDocument()
  expect(screen.getByText('Détails ici')).toBeInTheDocument()
})
