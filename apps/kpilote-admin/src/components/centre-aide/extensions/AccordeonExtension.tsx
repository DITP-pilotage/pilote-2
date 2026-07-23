import { mergeAttributes, Node } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { ChevronDown } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'

function AccordeonNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const title = (node.attrs.title as string) ?? ''
  // Ouvert par défaut pour pouvoir éditer le contenu. `forceMount` garde le
  // NodeViewContent monté quand c'est replié, sinon ProseMirror perd le contenu.
  const [ouvert, setOuvert] = useState(true)

  return (
    <NodeViewWrapper className="my-2">
      <Collapsible.Root
        open={ouvert}
        onOpenChange={setOuvert}
        className="overflow-hidden rounded-md border border-border"
      >
        <div className="flex items-center gap-2 bg-surface-tinted p-3" contentEditable={false}>
          <Collapsible.Trigger asChild>
            <button
              type="button"
              aria-label={ouvert ? 'Replier' : 'Déplier'}
              className="flex shrink-0 text-text-subtle"
            >
              <ChevronDown
                className={clsxm('size-4 transition-transform', !ouvert && '-rotate-90')}
              />
            </button>
          </Collapsible.Trigger>
          {editor.isEditable ? (
            <input
              value={title}
              onChange={(event) => updateAttributes({ title: event.target.value })}
              placeholder="Titre de l'accordéon…"
              className="flex-1 bg-transparent text-base font-medium outline-none"
            />
          ) : (
            <span className="flex-1 text-base font-medium">{title}</span>
          )}
        </div>
        <Collapsible.Content forceMount className="data-[state=closed]:hidden">
          <div className="px-4 pb-4 pt-3 text-sm leading-relaxed">
            <NodeViewContent />
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
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
