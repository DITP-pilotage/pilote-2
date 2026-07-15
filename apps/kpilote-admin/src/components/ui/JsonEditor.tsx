import { json, jsonParseLinter } from '@codemirror/lang-json'
import { lintGutter, linter } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { useCallback, useEffect, useRef } from 'react'

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
  const viewRef = useRef<EditorView | null>(null)
  // On garde `onChange`/`value` dans des refs pour éviter de recréer l'éditeur à
  // chaque render. `value` sert au doc initial d'un (re)mount ; un éventuel décalage
  // d'un render est corrigé par l'effet de synchronisation ci-dessous.
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  useEffect(() => {
    onChangeRef.current = onChange
    valueRef.current = value
  }, [onChange, value])

  // Callback ref (React 19) : React (re)appelle cette fonction quand son identité
  // change — donc quand `readOnly`/`minHeight` changent — et exécute le cleanup
  // retourné au démontage. Plus besoin de hostRef, d'un useEffect de création ni
  // d'eslint-disable : le cycle de vie de l'éditeur suit celui du nœud.
  const mountEditor = useCallback(
    (host: HTMLDivElement | null) => {
      if (!host) return
      const view = new EditorView({
        parent: host,
        state: EditorState.create({
          doc: valueRef.current,
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
    },
    [readOnly, minHeight],
  )

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
      ref={mountEditor}
      role="textbox"
      aria-label={ariaLabel}
      className={clsxm(
        'overflow-hidden rounded-md border border-border',
        readOnly && 'bg-surface-muted',
      )}
    />
  )
}
