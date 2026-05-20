import { useSuspenseQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { indicateurValeursQueryOptions } from '@/queries/indicateurs'

type IndicateurValeursTableProps = {
  indicateurId: string
  individuId: string
}

export function IndicateurValeursTable({
  indicateurId,
  individuId,
}: IndicateurValeursTableProps) {
  const { data } = useSuspenseQuery(indicateurValeursQueryOptions(indicateurId, individuId))

  const rows = [...data.items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  if (rows.length === 0) {
    return <EmptyState title="Aucune valeur pour cet individu." />
  }

  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell align="right">Valeur</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((row) => (
          <Table.Row key={row.date}>
            <Table.Cell>{new Date(row.date).toLocaleDateString('fr-FR')}</Table.Cell>
            <Table.Cell align="right">{row.valeur.toLocaleString('fr-FR')}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
