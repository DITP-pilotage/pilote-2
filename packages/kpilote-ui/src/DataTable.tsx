import type { ReactNode } from 'react'

import { Table } from './Table'

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  footer,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  footer?: ReactNode
}): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <Table>
        <Table.Head>
          <Table.Row>
            {columns.map((col) => (
              <Table.HeaderCell key={col.key}>{col.header}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {rows.map((row, i) => (
            <Table.Row key={getRowKey(row, i)}>
              {columns.map((col) => (
                <Table.Cell key={col.key}>{col.cell(row, i)}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {footer != null ? footer : null}
    </div>
  )
}
