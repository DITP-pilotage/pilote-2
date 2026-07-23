import { render, screen } from '@testing-library/react'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'

it('rend une image avec alt', () => {
  render(<ImageCentreAide src="https://x/y.png" alt="schéma" />)
  expect(screen.getByRole('img', { name: 'schéma' })).toHaveAttribute('src', 'https://x/y.png')
})

it('rend une iframe vidéo', () => {
  const { container } = render(<VideoCentreAide src="https://x/embed" titre="démo" />)
  const iframe = container.querySelector('iframe')
  expect(iframe).toHaveAttribute('src', 'https://x/embed')
})
