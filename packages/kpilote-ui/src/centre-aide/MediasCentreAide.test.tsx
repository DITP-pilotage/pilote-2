import { fireEvent, render, screen } from '@testing-library/react'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'

const FICHIERS_MEDIA =
  'https://fichiers.numerique.gouv.fr/media/preview/item/0f9e8d7c-6b5a-4c3d-8e2f-1a0b9c8d7e6f/demo.mp4'

it('rend une image avec alt', () => {
  render(<ImageCentreAide src="https://x/y.png" alt="schéma" />)
  expect(screen.getByRole('img', { name: 'schéma' })).toHaveAttribute('src', 'https://x/y.png')
})

it('ne monte l’iframe de la vidéo qu’au clic', () => {
  const { container } = render(<VideoCentreAide src="https://x/embed" titre="démo" />)
  expect(container.querySelector('iframe')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'démo' }))

  expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://x/embed')
})

it('retire l’autoplay de l’URL de la vidéo', () => {
  const { container } = render(<VideoCentreAide src="https://x/embed?autoplay=1&start=5" />)
  fireEvent.click(screen.getByRole('button', { name: 'Lire la vidéo' }))
  expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://x/embed?start=5')
})

it('lit un fichier fichiers.numerique avec le lecteur natif', () => {
  const { container } = render(<VideoCentreAide src={FICHIERS_MEDIA} />)
  expect(container.querySelector('video')).toHaveAttribute('src', FICHIERS_MEDIA)
  expect(container.querySelector('iframe')).toBeNull()
})

it('ne rend rien pour un schéma dangereux', () => {
  const { container } = render(<VideoCentreAide src="javascript:alert(1)" />)
  expect(container).toBeEmptyDOMElement()
})
