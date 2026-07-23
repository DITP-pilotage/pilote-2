import { mergeAttributes, Node } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'

function AccordeonNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const title = (node.attrs.title as string) ?? ''
  return (
    <NodeViewWrapper className="my-2">
      <div className="overflow-hidden rounded-md border border-border">
        <div contentEditable={false} className="flex items-center gap-2 bg-surface-tinted p-3">
          {editor.isEditable ? (
            <input
              value={title}
              onChange={(event) => updateAttributes({ title: event.target.value })}
              placeholder="Titre de l'accordéon…"
              className="flex-1 bg-transparent text-base font-medium outline-none"
            />
          ) : (
            <span className="text-base font-medium">{title}</span>
          )}
        </div>
        <div className="px-4 pb-4 pt-3 text-sm leading-relaxed">
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordionItem: {
      insertAccordion: (attrs?: { title?: string }) => ReturnType
    }
  }
}

export const AccordeonExtension = Node.create({
  name: 'accordionItem',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: 'Titre',
        parseHTML: (element) => element.getAttribute('data-title') ?? 'Titre',
        renderHTML: (attributes) => ({ 'data-title': attributes.title as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="accordion-item"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'accordion-item' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertAccordion:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { title: attrs?.title ?? 'Titre' },
            content: [{ type: 'paragraph' }],
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordeonNodeView)
  },
})
