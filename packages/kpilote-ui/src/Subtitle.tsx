import type { ReactNode } from 'react'

import { clsxm } from './clsxm'

// Texte d'accompagnement d'une section : consigne, précision de portée, note de
// bas de bloc. Se place au-dessus ou au-dessous du contenu qu'il commente.
export function Subtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsxm('text-xs text-text-subtle', className)}>{children}</p>
}
