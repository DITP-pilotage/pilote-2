import { Editor } from '@tiptap/core'

import { findCaretAtCalloutEnd, isCaretInCallout } from './calloutCaret'
import { extensionsCentreAide } from './extensions'

const buildEditor = (content: string): Editor =>
  new Editor({
    element: document.createElement('div'),
    extensions: extensionsCentreAide(),
    content,
  })

const findTextPos = ({ editor, text }: { editor: Editor; text: string }): number => {
  let found = -1
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === text) found = pos
  })
  return found
}

const findCalloutPositions = (editor: Editor): number[] => {
  const positions: number[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'callout') positions.push(pos)
  })
  return positions
}

const NESTED =
  '<div data-type="callout" data-color="info"><p>dehors</p><div data-type="callout" data-color="error"><p>dedans</p></div></div><p>après</p>'

describe('isCaretInCallout', () => {
  it('ne retient que l’encadré le plus proche du curseur', () => {
    const editor = buildEditor(NESTED)
    const [outer, inner] = findCalloutPositions(editor)

    editor.commands.setTextSelection(findTextPos({ editor, text: 'dedans' }) + 1)
    const { selection } = editor.state

    expect(isCaretInCallout({ selection, calloutPos: inner })).toBe(true)
    expect(isCaretInCallout({ selection, calloutPos: outer })).toBe(false)
    editor.destroy()
  })

  it('ne retient rien hors d’un encadré, même sans position connue', () => {
    const editor = buildEditor(NESTED)
    const [outer] = findCalloutPositions(editor)

    editor.commands.setTextSelection(findTextPos({ editor, text: 'après' }) + 1)
    const { selection } = editor.state

    expect(isCaretInCallout({ selection, calloutPos: outer })).toBe(false)
    expect(isCaretInCallout({ selection, calloutPos: undefined })).toBe(false)
    editor.destroy()
  })

  it('ignore une sélection de texte', () => {
    const editor = buildEditor('<div data-type="callout"><p>texte</p></div>')
    const [callout] = findCalloutPositions(editor)
    const from = findTextPos({ editor, text: 'texte' })

    editor.commands.setTextSelection({ from, to: from + 3 })

    expect(isCaretInCallout({ selection: editor.state.selection, calloutPos: callout })).toBe(false)
    editor.destroy()
  })
})

describe('findCaretAtCalloutEnd', () => {
  it('place le curseur à la fin du texte de l’encadré', () => {
    const editor = buildEditor('<p>avant</p><div data-type="callout"><p>texte</p></div>')
    const calloutPos = findCalloutPositions(editor)[0] ?? -1

    const caret = findCaretAtCalloutEnd({ doc: editor.state.doc, calloutPos })

    expect(caret?.from).toBe(findTextPos({ editor, text: 'texte' }) + 'texte'.length)
    editor.destroy()
  })

  it('renonce quand l’encadré se termine par un encadré imbriqué', () => {
    const editor = buildEditor(NESTED)
    const calloutPos = findCalloutPositions(editor)[0] ?? -1

    expect(findCaretAtCalloutEnd({ doc: editor.state.doc, calloutPos })).toBeNull()
    editor.destroy()
  })
})
