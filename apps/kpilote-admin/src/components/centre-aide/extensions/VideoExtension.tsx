import { parseMediaAlignment, parseMediaSize } from '@pilote/kpilote-shared/mediaLayout'
import { VideoCentreAide } from '@pilote/kpilote-ui/centre-aide'
import { mergeAttributes, Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'

import { MediaLayoutToolbar } from '@/components/centre-aide/MediaLayoutToolbar'

import { mediaLayoutAttributes } from './mediaLayoutAttributes'

function VideoNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? ''
  const alignment = parseMediaAlignment(node.attrs.alignment)
  const size = parseMediaSize(node.attrs.size)
  return (
    <NodeViewWrapper className="relative my-2" contentEditable={false}>
      {selected ? (
        <MediaLayoutToolbar
          alignment={alignment}
          size={size}
          onAlignmentChange={(value) => updateAttributes({ alignment: value })}
          onSizeChange={(value) => updateAttributes({ size: value })}
        />
      ) : null}
      {src ? (
        <VideoCentreAide
          src={src}
          alignment={alignment}
          size={size}
          // Le lecteur capterait le clic : le premier sélectionne la vidéo, les suivants
          // la pilotent.
          {...(selected ? {} : { className: 'pointer-events-none' })}
        />
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
      ...mediaLayoutAttributes,
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
