import { render } from '@testing-library/react'
import { IconeCentreAide } from './IconeCentreAide'

it('rend une icône connue', () => {
  const { container } = render(<IconeCentreAide type="info" />)
  expect(container.querySelector('svg')).not.toBeNull()
})

it('rend null pour un type inconnu', () => {
  const { container } = render(<IconeCentreAide type="zzz-inconnu" />)
  expect(container.querySelector('svg')).toBeNull()
})
