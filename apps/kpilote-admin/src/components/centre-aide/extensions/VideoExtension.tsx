import { mergeAttributes, Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { VideoCentreAide } from '@pilote/kpilote-ui/centre-aide'

function VideoNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? ''
  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      {src ? (
        <VideoCentreAide src={src} />
      ) : (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
          Vidéo sans URL
        </div>
      )}
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: { src: string }) => ReturnType
    }
  }
}

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') ?? '',
        renderHTML: (attributes) => ({ 'data-src': attributes.src as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'video' }, HTMLAttributes)]
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src: attrs.src } }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView)
  },
})
