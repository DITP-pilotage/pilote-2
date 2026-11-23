import { render } from '@testing-library/react'

import { RenduContenuCentreAide } from './RenduContenuCentreAide'

const renderImage = (attributes: string): Element | null =>
  render(
    <RenduContenuCentreAide
      html={`<img src="https://x/y.png" class="max-w-full rounded-md" ${attributes}>`}
    />,
  ).container.querySelector('img')

it('applique la mise en page enregistrée d’une image', () => {
  const image = renderImage('data-align="centre" data-largeur="petite"')
  expect(image).toHaveClass('mx-auto', 'max-w-[min(320px,100%)]', 'rounded-md')
  expect(image).not.toHaveClass('max-w-full')
})

it('garde la taille naturelle d’une image sans mise en page', () => {
  const image = renderImage('')
  expect(image).toHaveClass('max-w-full', 'rounded-md')
  expect(image).not.toHaveClass('w-full')
})

it('applique la mise en page enregistrée d’une vidéo', () => {
  const { container } = render(
    <RenduContenuCentreAide html='<div data-type="video" data-src="https://x/embed" data-align="droite" data-largeur="moyenne"></div>' />,
  )
  expect(container.querySelector('.aspect-video')).toHaveClass('ml-auto', 'max-w-[min(560px,100%)]')
})
