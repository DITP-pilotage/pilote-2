import { render } from '@testing-library/react'
import { registreBlocs } from './registreBlocs'

const elementDepuisHtml = (html: string): Element => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.firstElementChild as Element
}

it('déclare les 5 blocs indexés par data-type', () => {
  expect(Object.keys(registreBlocs).sort()).toEqual([
    'accordion-item',
    'callout',
    'icone',
    'image',
    'video',
  ])
})

it('rend un callout depuis son élément', () => {
  const element = elementDepuisHtml('<div data-type="callout" data-color="warning">Attention</div>')
  const { container } = render(
    <>{registreBlocs['callout']!.rendreDepuisElement(element, () => element.textContent)}</>,
  )
  expect(container.querySelector('[data-color="warning"]')).not.toBeNull()
  expect(container.textContent).toContain('Attention')
})

it('rend un accordéon avec son titre', () => {
  const element = elementDepuisHtml(
    '<div data-type="accordion-item" data-title="Aide">Contenu</div>',
  )
  const { getByRole } = render(
    <>{registreBlocs['accordion-item']!.rendreDepuisElement(element, () => element.textContent)}</>,
  )
  expect(getByRole('button', { name: /aide/i })).not.toBeNull()
})
