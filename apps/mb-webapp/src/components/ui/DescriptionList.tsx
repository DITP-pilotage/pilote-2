import type { ReactNode } from 'react'

import { Text } from '@/components/ui/Typography'

function Root({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded-lg border border-border bg-surface p-6">
      {children}
    </dl>
  )
}

function Item({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <Text as="dt" tone="muted">
        {label}
      </Text>
      <Text as="dd">{children}</Text>
    </>
  )
}

export const DescriptionList = Object.assign(Root, { Item })
