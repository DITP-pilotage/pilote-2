import { mergeAttributes, Node } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { Callout, type CalloutColor } from '@pilote/kpilote-ui/Callout'

function CalloutNodeView({ node }: NodeViewProps) {
  const color = (node.attrs.color as CalloutColor) ?? 'info'
  return (
    <NodeViewWrapper className="my-2">
      <Callout color={color}>
        <NodeViewContent />
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
