import { mergeAttributes, Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { IconeCentreAide } from '@pilote/kpilote-ui/centre-aide'

function IconeNodeView({ node }: NodeViewProps) {
  const type = (node.attrs.type as string) ?? 'info'
  return (
    <NodeViewWrapper as="span" className="inline-flex align-middle">
      <IconeCentreAide type={type} />
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    icone: {
      insertIcone: (attrs?: { type?: string }) => ReturnType
    }
  }
}

export const IconeExtension = Node.create({
  name: 'icone',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-icon-type') ?? 'info',
        renderHTML: (attributes) => ({ 'data-icon-type': attributes.type as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="icone"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'icone' }, HTMLAttributes)]
  },

  addCommands() {
    return {
      insertIcone:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { type: attrs?.type ?? 'info' } }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(IconeNodeView)
  },
})
