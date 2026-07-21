import { Slot as SlotPrimitive } from 'radix-ui'
import { ArrowUpRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Heading, Text } from './Typography'
import { clsxm } from './clsxm'

type EntityCardProps = Omit<ComponentProps<'div'>, 'title'> & {
  asChild?: boolean
  kicker?: ReactNode
  title: ReactNode
  // Contenu principal, aligné sous le titre, qui occupe la hauteur restante de
  // la carte (via flex-1). Le contenu gère lui-même son alignement interne.
  body?: ReactNode
  // Légende de pied de carte, épinglée en bas.
  footer?: ReactNode
}

const styles = [
  'group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl bg-surface py-5 pl-6 pr-5',
  'border border-border-strong transition-all duration-150',
  'hover:border-primary hover:bg-surface-tinted hover:-translate-y-0.5',
  'focus-within:border-primary focus-within:bg-surface-tinted',
].join(' ')

export function EntityCard({
  asChild = false,
  kicker,
  title,
  body,
  footer,
  className,
  children,
  ...props
}: EntityCardProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'div'
  return (
    <Comp className={clsxm(styles, className)} {...props}>
      {kicker && (
        <Text as="span" variant="kicker">
          {kicker}
        </Text>
      )}
      <Heading
        as="h3"
        size="md"
        className="text-blue-cumulus transition-colors group-hover:text-primary"
      >
        {title}
      </Heading>
      <SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable>
      {body && <div className="flex flex-1 flex-col">{body}</div>}
      {footer && (
        <Text as="div" variant="caption" tone="subtle" className="mt-auto">
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
