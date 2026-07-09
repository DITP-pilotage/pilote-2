import type { DataTableColumn } from '@/components/ui/DataTable'
import { DataTable } from '@/components/ui/DataTable'

import type { ParsedRow } from './parseFichierValeurs'

const MAX_LIGNES_AFFICHEES = 100

export function ImportPreviewTable({ rows }: { rows: ParsedRow[] }) {
  const visibles = rows.slice(0, MAX_LIGNES_AFFICHEES)
  const reste = rows.length - visibles.length

  const columns: DataTableColumn<ParsedRow>[] = [
    {
      key: '#',
      header: '#',
      cell: (_, index) => <span className="text-text-subtle">{index + 2}</span>,
    },
    {
      key: 'individu',
      header: 'individu',
      cell: (row) => <span className="font-mono text-[13px]">{row.individu}</span>,
    },
    {
      key: 'date',
      header: 'date',
      cell: (row) => <span className="font-mono text-[13px]">{row.date}</span>,
    },
    {
      key: 'valeur',
      header: 'valeur',
      cell: (row) => <span className="font-mono text-[13px]">{String(row.valeur)}</span>,
    },
  ]

  const footer =
    reste > 0 ? (
      <div className="border-t border-border bg-surface px-5 py-3 text-center text-xs text-text-subtle">
        … et {reste} autre{reste > 1 ? 's' : ''} ligne{reste > 1 ? 's' : ''}
      </div>
    ) : null

  return (
    <DataTable<ParsedRow>
      columns={columns}
      rows={visibles}
      getRowKey={(_, i) => i}
      footer={footer}
    />
  )
}
