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
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Head({ children }: { children: ReactNode }) {
  return <thead className="bg-secondary-hover text-text">{children}</thead>
}

function Body({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

function Row({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}

function HeaderCell({
  align = 'left',
  className,
  children,
  ...props
}: ComponentProps<'th'> & { align?: Align }) {
  return (
    <th
      className={clsxm('px-4 py-2 font-medium text-text', alignClasses[align], className)}
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
    <td className={clsxm('px-4 py-2 text-text', alignClasses[align], className)} {...props}>
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
