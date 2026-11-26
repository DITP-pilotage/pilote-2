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
  // Actions posées dans le coin de la carte (bouton, menu…). Elles restent hors
  // de la carte, et donc hors du lien quand la carte en est un : un bouton dans
  // un lien n'est ni valide ni accessible. Pour réagir au survol ou au focus de
  // la carte, elles utilisent le groupe `entity-card`
  // (`group-hover/entity-card:opacity-100`).
  actions?: ReactNode
}

const styles = [
  'group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl bg-surface py-5 pl-6 pr-5',
  'border border-border transition-all duration-150',
  'hover:border-primary hover:bg-surface-tinted hover:-translate-y-0.5',
  'focus-within:border-primary focus-within:bg-surface-tinted',
].join(' ')

export function EntityCard({
  asChild = false,
  kicker,
  title,
  body,
  footer,
  actions,
  className,
  children,
  ...props
}: EntityCardProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'div'
  const card = (
    <Comp className={clsxm(styles, className)} {...props}>
      {kicker && (
        <Text as="span" variant="kicker">
          {kicker}
        </Text>
      )}
      <Heading
        as="h3"
        size="md"
        className={clsxm(
          'text-blue-cumulus transition-colors group-hover:text-primary',
          actions && 'pr-8',
        )}
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
      {actions ? null : (
        <ArrowUpRight
          className="absolute right-5 top-5 size-4 text-text-subtle opacity-0 transition-opacity group-hover:text-primary group-hover:opacity-100"
          aria-hidden
        />
      )}
    </Comp>
  )
  if (!actions) return card
  return (
    <div className="group/entity-card relative h-full">
      {card}
      <div className="absolute right-3 top-3">{actions}</div>
    </div>
  )
}
