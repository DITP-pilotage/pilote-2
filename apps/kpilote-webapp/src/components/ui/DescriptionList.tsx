import type { ReactNode } from 'react'

import { Text } from '@pilote/kpilote-ui/Typography'

function Root({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-10 gap-y-4 rounded-xl bg-surface-tinted p-6 sm:p-8">
      {children}
    </dl>
  )
}

function Item({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <Text as="dt" variant="kicker" tone="muted">
        {label}
      </Text>
      <Text as="dd" weight="medium">
        {children}
      </Text>
    </>
  )
}

export const DescriptionList = Object.assign(Root, { Item })
