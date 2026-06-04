import type { ComponentProps, ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type Align = 'left' | 'right' | 'center'

const alignClasses: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

function Root({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Head({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-tinted text-text">{children}</thead>
}

function Body({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-border [&>tr:hover]:bg-surface-tinted/60">{children}</tbody>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <tr className="transition-colors">{children}</tr>
}

function HeaderCell({
  align = 'left',
  className,
  children,
  ...props
}: ComponentProps<'th'> & { align?: Align }) {
  return (
    <th
      className={clsxm(
        'px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted',
        alignClasses[align],
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

function Cell({
  align = 'left',
  className,
  children,
  ...props
}: ComponentProps<'td'> & { align?: Align }) {
  return (
    <td className={clsxm('px-5 py-3.5 text-text', alignClasses[align], className)} {...props}>
      {children}
    </td>
  )
}

export const Table = Object.assign(Root, {
  Head,
  Body,
  Row,
  HeaderCell,
  Cell,
})
