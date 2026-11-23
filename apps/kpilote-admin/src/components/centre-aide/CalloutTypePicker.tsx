import { CALLOUT_VARIANTES, COULEURS_CALLOUT, type CalloutColor } from '@pilote/kpilote-ui/Callout'
import { useEditorState, type NodeViewProps } from '@tiptap/react'
import { useState, type FocusEvent, type MouseEvent } from 'react'

import { clsxm } from '@/lib/clsxm'

import { findCaretAtCalloutEnd, isCaretInCallout } from './calloutCaret'
import { FloatingToolbar, FloatingToolbarButton } from './FloatingToolbar'

export function CalloutTypePicker({
  color,
  editor,
  getPos,
  onChange,
}: Pick<NodeViewProps, 'editor' | 'getPos'> & {
  color: CalloutColor
  onChange: (color: CalloutColor) => void
}) {
  const [hasFocusWithin, setHasFocusWithin] = useState(false)

  const hasCaretInside = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance.isFocused &&
      isCaretInCallout({ selection: instance.state.selection, calloutPos: getPos() }),
  })
  const isOpen = hasCaretInside || hasFocusWithin
  const { Icon: CurrentIcon } = CALLOUT_VARIANTES[color]

  const openFromIcon = (event: MouseEvent<HTMLButtonElement>) => {
    const calloutPos = getPos()
    if (hasCaretInside || calloutPos === undefined) return

    const caret = findCaretAtCalloutEnd({ doc: editor.state.doc, calloutPos })
    if (!caret) {
      event.currentTarget.focus()
      return
    }

    editor
      .chain()
      .command(({ tr }) => {
        tr.setSelection(caret)
        return true
      })
      .focus()
      .run()
  }

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) =>
    setHasFocusWithin(event.currentTarget.contains(event.relatedTarget))

  return (
    <div
      contentEditable={false}
      onBlur={closeWhenFocusLeaves}
      onFocus={() => setHasFocusWithin(true)}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Changer le type d’encadré"
        title="Changer le type d’encadré"
        onMouseDown={(event) => event.preventDefault()}
        onClick={openFromIcon}
        // Le retrait négatif agrandit la zone cliquable sans décaler l'icône.
        className={clsxm(
          '-m-1 block rounded p-1 transition-colors hover:bg-black/10',
          isOpen && 'bg-black/10',
        )}
      >
        <CurrentIcon className="pointer-events-none size-5" />
      </button>
      {isOpen ? (
        <FloatingToolbar label="Type d’encadré">
          {COULEURS_CALLOUT.map((couleur) => {
            const { label, background, iconColor, Icon } = CALLOUT_VARIANTES[couleur]
            return (
              <FloatingToolbarButton
                key={couleur}
                isActive={couleur === color}
                label={label}
                onClick={() => onChange(couleur)}
              >
                <span
                  className={clsxm(
                    'pointer-events-none flex size-5 items-center justify-center rounded-sm',
                    background,
                    iconColor,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </FloatingToolbarButton>
            )
          })}
        </FloatingToolbar>
      ) : null}
    </div>
  )
}
