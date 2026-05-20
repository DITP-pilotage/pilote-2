import { Slot, Slottable } from '@radix-ui/react-slot'
import type { ComponentProps, ReactNode } from 'react'

import { Body } from '@/components/ui/Body'
import { Heading } from '@/components/ui/Heading'
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
        <Body as="span" variant="kicker">
          {kicker}
        </Body>
      )}
      <Heading as="h3" size="md" className="group-hover:text-primary">
        {title}
      </Heading>
      {footer && (
        <Body as="div" variant="caption" className="mt-auto">
          {footer}
        </Body>
      )}
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
