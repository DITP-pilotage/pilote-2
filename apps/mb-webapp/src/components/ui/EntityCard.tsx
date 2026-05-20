import { Slot, Slottable } from '@radix-ui/react-slot'
import type { ComponentProps, ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type EntityCardProps = Omit<ComponentProps<'div'>, 'title'> & {
  asChild?: boolean
  kicker?: ReactNode
  title: ReactNode
  footer?: ReactNode
}

const styles =
  'group flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-secondary-border hover:bg-secondary-hover'

export function EntityCard({
  asChild = false,
  kicker,
  title,
  footer,
  className,
  children,
  ...props
}: EntityCardProps) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp className={clsxm(styles, className)} {...props}>
      {kicker && (
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {kicker}
        </span>
      )}
      <h3 className="text-base font-semibold text-text group-hover:text-primary">{title}</h3>
      {footer && <div className="mt-auto text-xs text-text-muted">{footer}</div>}
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
