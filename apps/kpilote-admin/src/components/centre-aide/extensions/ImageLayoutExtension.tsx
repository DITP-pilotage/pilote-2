import { parseMediaAlignment, parseMediaSize } from '@pilote/kpilote-shared/mediaLayout'
import { ImageCentreAide } from '@pilote/kpilote-ui/centre-aide'
import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'

import { MediaLayoutToolbar } from '@/components/centre-aide/MediaLayoutToolbar'

import { mediaLayoutAttributes } from './mediaLayoutAttributes'

function ImageNodeView({ node, selected, updateAttributes }: NodeViewProps) {
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
      <ImageCentreAide
        src={(node.attrs.src as string | null) ?? ''}
        alt={(node.attrs.alt as string | null) ?? ''}
        alignment={alignment}
        size={size}
      />
    </NodeViewWrapper>
  )
}

export const ImageLayoutExtension = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), ...mediaLayoutAttributes }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
