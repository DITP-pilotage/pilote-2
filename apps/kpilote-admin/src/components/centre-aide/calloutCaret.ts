import { findParentNodeClosestToPos } from '@tiptap/core'
import type { Node, ResolvedPos } from '@tiptap/pm/model'
import { Selection } from '@tiptap/pm/state'

const findClosestCalloutPos = ($pos: ResolvedPos): number | undefined =>
  findParentNodeClosestToPos($pos, (node) => node.type.name === 'callout')?.pos

// Vrai pour l'encadré le plus proche du curseur seulement : deux encadrés imbriqués
// n'affichent pas chacun leur barre. Une sélection de texte ne compte pas, elle ouvre
// la bulle de mise en forme au même endroit.
export const isCaretInCallout = ({
  selection,
  calloutPos,
}: {
  selection: Selection
  calloutPos: number | undefined
}): boolean => {
  if (calloutPos === undefined) return false
  return selection.empty && findClosestCalloutPos(selection.$from) === calloutPos
}

// Dernière position de texte de l'encadré, ou null s'il n'a pas de texte à lui en fin
// de contenu (encadré imbriqué, média).
export const findCaretAtCalloutEnd = ({
  doc,
  calloutPos,
}: {
  doc: Node
  calloutPos: number
}): Selection | null => {
  const callout = doc.nodeAt(calloutPos)
  if (!callout) return null

  const calloutEnd = calloutPos + callout.nodeSize - 1
  const caret = Selection.findFrom(doc.resolve(calloutEnd), -1, true)
  if (!caret) return null

  return isCaretInCallout({ selection: caret, calloutPos }) ? caret : null
}
