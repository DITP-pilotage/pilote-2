import { json, jsonParseLinter } from '@codemirror/lang-json'
import { lintGutter, linter } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'

import { clsxm } from '@/lib/clsxm'

export const formatJson = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed) return raw
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    return raw
  }
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = 200,
  ariaLabel = 'Éditeur JSON',
}: {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  minHeight?: number
  ariaLabel?: string
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  // On garde `onChange` dans une ref pour éviter de recréer l'éditeur à chaque render.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!hostRef.current) return
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          json(),
          linter(jsonParseLinter()),
          lintGutter(),
          keymap.of([]),
          EditorView.lineWrapping,
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.theme({
            '&': { fontSize: '13px', minHeight: `${minHeight}px` },
            '.cm-scroller': { fontFamily: 'ui-monospace, monospace' },
            '&.cm-focused': { outline: 'none' },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Recréation uniquement si le mode read-only ou la hauteur change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, minHeight])

  // Synchronise la valeur externe (ex. picker qui pré-remplit) sans casser le curseur.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  return (
    <div
      ref={hostRef}
      role="textbox"
      aria-label={ariaLabel}
      className={clsxm(
        'overflow-hidden rounded-md border border-border',
        readOnly && 'bg-surface-muted',
      )}
    />
  )
}
