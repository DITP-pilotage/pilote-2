import { Mail } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/ui/EmptyState'
import { Heading, Text } from '@/components/ui/Typography'
import { panierResponsablesQueryOptions } from '@/queries/paniers'

function Initiales({ nom, prenom }: { nom: string | null; prenom: string | null }) {
  const initiales = [prenom, nom]
    .filter(Boolean)
    .map((s) => s![0]!.toUpperCase())
    .join('')
    .slice(0, 2)
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary select-none">
      {initiales || '?'}
    </div>
  )
}

export function PanierGouvernanceTab({ panierId }: { panierId: string }) {
  const { data } = useSuspenseQuery(panierResponsablesQueryOptions(panierId))

  return (
    <div className="flex flex-col gap-4">
      <Heading size="sm">Responsables</Heading>
      {data.items.length === 0 ? (
        <EmptyState title="Aucun responsable désigné pour ce panier." />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {data.items.map((r) => {
            const nomComplet = [r.prenom, r.nom].filter(Boolean).join(' ')
            const meta = [r.fonction, r.service].filter(Boolean).join(' · ')
            return (
              <li key={r.email} className="flex items-center gap-4 px-5 py-4">
                <Initiales nom={r.nom} prenom={r.prenom} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text weight="medium">{nomComplet || r.email}</Text>
                  {meta && (
                    <Text variant="caption" tone="muted">
                      {meta}
                    </Text>
                  )}
                </div>
                <a
                  href={`mailto:${r.email}`}
                  className="flex shrink-0 items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
                >
                  <Mail className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{r.email}</span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
