import { render, screen } from '@testing-library/react'
import { RenduContenuCentreAide } from './RenduContenuCentreAide'

it('rend le HTML riche standard', () => {
  render(<RenduContenuCentreAide html="<p>Bonjour</p><ul><li>un</li></ul>" />)
  expect(screen.getByText('Bonjour')).toBeInTheDocument()
  expect(screen.getByText('un')).toBeInTheDocument()
})

it('mappe un callout via le registre', () => {
  const { container } = render(
    <RenduContenuCentreAide html='<div data-type="callout" data-color="success">OK</div>' />,
  )
  expect(container.querySelector('[data-color="success"]')).not.toBeNull()
})

it('neutralise le script injecté mais garde le texte', () => {
  const { container } = render(
    <RenduContenuCentreAide html="<p>sain</p><script>alert(1)</script>" />,
  )
  expect(container.querySelector('script')).toBeNull()
  expect(container.textContent).toContain('sain')
})

it('retourne null pour un html vide', () => {
  const { container } = render(<RenduContenuCentreAide html="" />)
  expect(container.firstChild).toBeNull()
})
