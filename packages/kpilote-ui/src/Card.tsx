import type { ComponentProps, ReactNode } from 'react'

import { Text } from './Typography'
import { clsxm } from './clsxm'

type CardProps = ComponentProps<'div'> & {
  kicker?: ReactNode
}

export function Card({ kicker, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsxm('rounded-xl border border-border bg-surface p-6 sm:p-8', className)}
      {...props}
    >
      {kicker && (
        <Text as="p" variant="kicker" className="mb-4">
          {kicker}
        </Text>
      )}
      {children}
    </div>
  )
}
