import type { ReactNode } from 'react'

function Root({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded-lg border border-border bg-surface p-6 text-sm">
      {children}
    </dl>
  )
}

function Item({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <>
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text">{children}</dd>
    </>
  )
}

export const DescriptionList = Object.assign(Root, { Item })
