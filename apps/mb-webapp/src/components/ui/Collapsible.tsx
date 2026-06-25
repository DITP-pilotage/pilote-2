import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import { type ComponentProps, type CSSProperties } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Collapsible = CollapsiblePrimitive.Root
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger

const animation =
  'data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up'

type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.Content> & {
  // Hauteur d'aperçu visible quand replié (ex. "4.5rem"). Absente = repli total (0).
  peek?: string
}

export function CollapsibleContent({ className, peek, style, ...props }: CollapsibleContentProps) {
  if (peek === undefined) {
    return (
      <CollapsiblePrimitive.Content
        className={clsxm('overflow-hidden', animation, className)}
        {...props}
      />
    )
  }

  // Mode aperçu : le contenu reste monté (forceMount) et est borné à `peek` quand
  // replié ; l'animation interpole entre `peek` et la hauteur réelle mesurée par radix.
  return (
    <CollapsiblePrimitive.Content
      forceMount
      style={{ ...style, '--collapsible-peek': peek } as CSSProperties}
      className={clsxm(
        'overflow-hidden data-[state=closed]:max-h-[var(--collapsible-peek)]',
        animation,
        className,
      )}
      {...props}
    />
  )
}
