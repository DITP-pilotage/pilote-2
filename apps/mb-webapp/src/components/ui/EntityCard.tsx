import { Slot, Slottable } from '@radix-ui/react-slot'
import type { ComponentProps, ReactNode } from 'react'

import { Heading, Text } from '@/components/ui/Typography'
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
        <Text as="span" variant="kicker">
          {kicker}
        </Text>
      )}
      <Heading as="h3" size="md" className="group-hover:text-primary">
        {title}
      </Heading>
      {footer && (
        <Text as="div" variant="caption" className="mt-auto">
          {footer}
        </Text>
      )}
      <Slottable>{children}</Slottable>
    </Comp>
  )
}
