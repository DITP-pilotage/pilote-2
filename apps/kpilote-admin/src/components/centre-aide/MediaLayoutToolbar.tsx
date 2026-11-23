import {
  MEDIA_ALIGNMENTS,
  MEDIA_SIZES,
  type MediaAlignment,
  type MediaSize,
} from '@pilote/kpilote-shared/mediaLayout'
import { TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react'
import type { ComponentType } from 'react'

import { FloatingToolbar, FloatingToolbarButton } from './FloatingToolbar'

const ALIGNMENT_BUTTONS: Record<
  MediaAlignment,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  gauche: { label: 'Aligner à gauche', Icon: TextAlignStart },
  centre: { label: 'Centrer', Icon: TextAlignCenter },
  droite: { label: 'Aligner à droite', Icon: TextAlignEnd },
}

const SIZE_BUTTONS: Record<MediaSize, { label: string; shortLabel: string }> = {
  petite: { label: 'Petite largeur', shortLabel: 'S' },
  moyenne: { label: 'Largeur moyenne', shortLabel: 'M' },
  pleine: { label: 'Pleine largeur', shortLabel: 'L' },
}

export function MediaLayoutToolbar({
  alignment,
  size,
  onAlignmentChange,
  onSizeChange,
}: {
  alignment: MediaAlignment
  size: MediaSize
  onAlignmentChange: (alignment: MediaAlignment) => void
  onSizeChange: (size: MediaSize) => void
}) {
  return (
    <FloatingToolbar label="Mise en page du média">
      {MEDIA_ALIGNMENTS.map((value) => {
        const { label, Icon } = ALIGNMENT_BUTTONS[value]
        return (
          <FloatingToolbarButton
            key={value}
            isActive={value === alignment}
            label={label}
            onClick={() => onAlignmentChange(value)}
          >
            <Icon className="size-4" />
          </FloatingToolbarButton>
        )
      })}
      <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
      {MEDIA_SIZES.map((value) => {
        const { label, shortLabel } = SIZE_BUTTONS[value]
        return (
          <FloatingToolbarButton
            key={value}
            isActive={value === size}
            label={label}
            onClick={() => onSizeChange(value)}
          >
            <span className="text-xs font-semibold">{shortLabel}</span>
          </FloatingToolbarButton>
        )
      })}
    </FloatingToolbar>
  )
}
