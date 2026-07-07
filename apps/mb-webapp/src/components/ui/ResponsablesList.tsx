import { Mail } from 'lucide-react'
import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Typography'

function Initiales({ nom, prenom }: { nom: string; prenom: string }) {
  const initiales = [prenom, nom]
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .join('')
    .slice(0, 2)
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary select-none">
      {initiales || '?'}
    </div>
  )
}

export function ResponsablesList({ responsables }: { responsables: ResponsableApiModel[] }) {
  if (responsables.length === 0) {
    return <EmptyState title="Aucun responsable désigné." />
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {responsables.map((r) => {
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
              aria-label={`Envoyer un email à ${r.email}`}
              className="flex shrink-0 items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <Mail className="size-4" aria-hidden />
              <span className="hidden sm:inline">{r.email}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
