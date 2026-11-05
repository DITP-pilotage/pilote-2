import { describe, expect, it } from 'vitest'

import { remarkEntityLinks, type MarkdownNode } from './remarkEntityLinks'

const paragraph = (value: string): MarkdownNode => ({
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
})

const links = (tree: MarkdownNode): string[] =>
  (tree.children?.[0]?.children ?? [])
    .filter((node) => node.type === 'link')
    .map((node) => node.url ?? '')

describe('remarkEntityLinks', () => {
  it('relie les indicateurs et les collections à leur page', () => {
    const tree = paragraph('Fraude fiscale (IND-42) dans Santé (COL-7).')
    remarkEntityLinks()(tree)
    expect(links(tree)).toEqual(['/indicateurs/IND-42', '/collections/COL-7'])
  })

  it('accepte un tiret insécable et reconstruit l’identifiant canonique', () => {
    const tree = paragraph('Voir IND‑42.')
    remarkEntityLinks()(tree)
    expect(links(tree)).toEqual(['/indicateurs/IND-42'])
  })

  it('ne touche pas un texte déjà dans un lien', () => {
    const tree: MarkdownNode = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'link', url: '/x', children: [{ type: 'text', value: 'IND-1' }] }],
        },
      ],
    }
    remarkEntityLinks()(tree)
    expect(links(tree)).toEqual(['/x'])
  })
})
