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

  // Mode aperçu : le contenu reste monté (forceMount) et on anime la `height` via
  // une transition CSS entre deux valeurs explicites — `--collapsible-peek` (replié)
  // et `--collapsible-full` (hauteur réelle, fournie par le consommateur qui mesure).
  // Plus fiable que les keyframes basées sur la variable radix, dont le timing à
  // l'ouverture est aléatoire avec forceMount.
  return (
    <CollapsiblePrimitive.Content
      forceMount
      style={{ ...style, '--collapsible-peek': peek } as CSSProperties}
      className={clsxm(
        'overflow-hidden transition-[height] duration-200 ease-out',
        'data-[state=closed]:h-[var(--collapsible-peek)]',
        'data-[state=open]:h-[var(--collapsible-full,auto)]',
        className,
      )}
      {...props}
    />
  )
}
