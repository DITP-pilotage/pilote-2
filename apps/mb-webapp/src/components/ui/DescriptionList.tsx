import type { ReactNode } from 'react'

import { Body } from '@/components/ui/Body'

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
      <Body as="dt" tone="muted">
        {label}
      </Body>
      <Body as="dd">{children}</Body>
    </>
  )
}

export const DescriptionList = Object.assign(Root, { Item })
