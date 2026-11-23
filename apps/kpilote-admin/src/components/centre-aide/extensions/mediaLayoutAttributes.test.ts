import { Editor } from '@tiptap/core'

import { extensionsCentreAide } from './index'

const exportHtml = (content: string): string => {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: extensionsCentreAide(),
    content,
  })
  const html = editor.getHTML()
  editor.destroy()
  return html
}

it('ne modifie pas le HTML d’un média sans mise en page', () => {
  const html = exportHtml(
    '<img src="https://x/y.png"><div data-type="video" data-src="https://x/embed"></div>',
  )
  expect(html).not.toContain('data-align')
  expect(html).not.toContain('data-largeur')
})

it('conserve la mise en page d’une image et d’une vidéo', () => {
  const html = exportHtml(
    '<img src="https://x/y.png" data-align="centre" data-largeur="petite"><div data-type="video" data-src="https://x/embed" data-align="droite" data-largeur="moyenne"></div>',
  )
  expect(html).toMatch(/<img[^>]*data-align="centre"[^>]*data-largeur="petite"/)
  expect(html).toMatch(/data-type="video"[^>]*data-align="droite"[^>]*data-largeur="moyenne"/)
})
