import { mergeAttributes, Node } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { Callout, COULEURS_CALLOUT, type CalloutColor } from '@pilote/kpilote-ui/centre-aide'

const LIBELLES: Record<CalloutColor, string> = {
  info: 'Info',
  success: 'Succès',
  warning: 'Attention',
  error: 'Alerte',
}

function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const color = (node.attrs.color as CalloutColor) ?? 'info'
  return (
    <NodeViewWrapper className="my-2">
      <Callout color={color}>
        <div className="min-w-0 flex-1">
          {editor.isEditable ? (
            <div contentEditable={false} className="mb-1">
              <select
                value={color}
                onChange={(event) => updateAttributes({ color: event.target.value })}
                className="rounded border border-border bg-surface px-1 py-0.5 text-xs"
              >
                {COULEURS_CALLOUT.map((couleur) => (
                  <option key={couleur} value={couleur}>
                    {LIBELLES[couleur]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <NodeViewContent />
        </div>
      </Callout>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (attrs?: { color?: CalloutColor }) => ReturnType
    }
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-color') ?? 'info',
        renderHTML: (attributes) => ({ 'data-color': attributes.color as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertCallout:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { color: attrs?.color ?? 'info' },
            content: [{ type: 'paragraph' }],
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
