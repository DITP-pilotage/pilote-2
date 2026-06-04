import { Slot, Slottable } from '@radix-ui/react-slot'
import { ArrowLeft } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

type BackLinkProps = ComponentProps<'button'> & {
  asChild?: boolean
}

const styles =
  'group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-primary'

export function BackLink({ asChild = false, className, children, ...props }: BackLinkProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={clsxm(styles, className)} {...props}>
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
