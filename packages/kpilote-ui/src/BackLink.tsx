import { Slot as SlotPrimitive } from 'radix-ui'
import { ArrowLeft } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from './clsxm'

type BackLinkProps = ComponentProps<'button'> & {
  asChild?: boolean
}

const styles =
  'group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-primary'

export function BackLink({ asChild = false, className, children, ...props }: BackLinkProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return (
    <Comp className={clsxm(styles, className)} {...props}>
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      <SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable>
    </Comp>
  )
}
