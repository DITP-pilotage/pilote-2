import { Slot, Slottable } from '@radix-ui/react-slot'
import { ArrowUpRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Heading, Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'

type EntityCardProps = Omit<ComponentProps<'div'>, 'title'> & {
  asChild?: boolean
  kicker?: ReactNode
  title: ReactNode
  footer?: ReactNode
}

const styles = [
  'group relative flex h-full flex-col gap-3 rounded-xl bg-surface p-6',
  'border border-border transition-all duration-150',
  'hover:border-primary hover:bg-surface-tinted hover:-translate-y-0.5',
  'focus-within:border-primary focus-within:bg-surface-tinted',
].join(' ')

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
      <Heading as="h3" size="md" className="text-text transition-colors group-hover:text-primary">
        {title}
      </Heading>
      <Slottable>{children}</Slottable>
      {footer && (
        <Text as="div" variant="caption" tone="subtle" className="mt-auto pt-2">
          {footer}
        </Text>
      )}
      <ArrowUpRight
        className="absolute right-5 top-5 size-4 text-text-subtle opacity-0 transition-opacity group-hover:text-primary group-hover:opacity-100"
        aria-hidden
      />
    </Comp>
  )
}
