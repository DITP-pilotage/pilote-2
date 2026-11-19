import { type ReactNode } from 'react'

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-text-subtle">{title}</h4>
      {children}
    </section>
  )
}
