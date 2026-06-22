import { useSuspenseQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { Heading, Text } from '@/components/ui/Typography'
import { panierResponsablesQueryOptions } from '@/queries/paniers'

export function PanierGouvernanceTab({ panierId }: { panierId: string }) {
  const { data } = useSuspenseQuery(panierResponsablesQueryOptions(panierId))

  return (
    <div className="flex flex-col gap-4">
      <Heading size="sm">Responsables</Heading>
      {data.items.length === 0 ? (
        <EmptyState title="Aucun responsable désigné pour ce panier." />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((r) => {
            const nomComplet = [r.prenom, r.nom].filter(Boolean).join(' ')
            return (
              <li key={r.email} className="rounded-lg border border-border p-4 flex flex-col gap-1">
                <Text weight="medium">{nomComplet || r.email}</Text>
                {r.fonction && <Text tone="muted">Fonction : {r.fonction}</Text>}
                {r.service && <Text tone="muted">Service : {r.service}</Text>}
                <Text tone="muted">
                  Email :{' '}
                  <a href={`mailto:${r.email}`} className="underline hover:text-text">
                    {r.email}
                  </a>
                </Text>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
