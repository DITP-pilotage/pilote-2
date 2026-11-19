import { type Kind } from '@/lib/axeArbre'
import { clsxm } from '@/lib/clsxm'

const KIND_COLOR: Record<Kind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

const SHAPE_CLASS = {
  dot: 'size-2 rounded-full',
  'large-dot': 'size-2.5 rounded-full',
  bar: 'w-1',
} as const

// La couleur d'une modalité selon son rôle : feuille saisie, parente calculée, « Tous ».
export function KindMarker({
  kind,
  shape = 'dot',
}: {
  kind: Kind
  shape?: keyof typeof SHAPE_CLASS
}) {
  return <span className={clsxm('shrink-0', SHAPE_CLASS[shape], KIND_COLOR[kind])} />
}
