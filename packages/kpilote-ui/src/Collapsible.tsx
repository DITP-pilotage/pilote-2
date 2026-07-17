import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { clsxm } from './clsxm'

export const Collapsible = CollapsiblePrimitive.Root
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger

// Contenu repliable générique, animé 0 ↔ hauteur réelle (mesurée par radix via
// --radix-collapsible-content-height).
export function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={clsxm(
        'overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up',
        className,
      )}
      {...props}
    />
  )
}
