import { Editor } from '@tiptap/core'

import { extensionsCentreAide } from './index'

// Garde-fou du bug ppg (PIL-1685 #3) : mettre une ligne en titre ne devait PAS
// transformer les lignes voisines. Nos vrais paragraphes garantissent que la mise
// en titre ne touche que le bloc sélectionné.
it('n’applique le titre qu’au paragraphe sélectionné', () => {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: extensionsCentreAide(),
    content: '<p>A</p><p>B</p><p>C</p>',
  })

  // Position 4 = à l'intérieur du 2e paragraphe (B).
  editor.commands.setTextSelection(4)
  editor.chain().focus().toggleHeading({ level: 2 }).run()

  const html = editor.getHTML()
  expect(html).toContain('<h2>B</h2>')
  expect(html).toContain('<p>A</p>')
  expect(html).toContain('<p>C</p>')

  editor.destroy()
})
