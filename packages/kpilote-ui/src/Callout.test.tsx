import { render, screen } from '@testing-library/react'
import { Callout } from './Callout'

it('affiche le contenu et applique la variante de couleur', () => {
  render(<Callout color="success">Bien joué</Callout>)
  const bloc = screen.getByText('Bien joué').closest('[data-color]')
  expect(bloc).toHaveAttribute('data-color', 'success')
})

it('utilise la couleur info par défaut', () => {
  render(<Callout>Info</Callout>)
  expect(screen.getByText('Info').closest('[data-color]')).toHaveAttribute('data-color', 'info')
})
