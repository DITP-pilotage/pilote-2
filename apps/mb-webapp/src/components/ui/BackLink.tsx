import { Slot, Slottable } from '@radix-ui/react-slot'
import { ArrowLeft } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

type BackLinkProps = ComponentProps<'button'> & {
  asChild?: boolean
}

const styles =
  'inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors'

export function BackLink({ asChild = false, className, children, ...props }: BackLinkProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={clsxm(styles, className)} {...props}>
      <ArrowLeft className="size-4" />
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
