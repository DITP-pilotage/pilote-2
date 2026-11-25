import { pluralize } from '@pilote/kpilote-shared/texte'
import { Check, FileSpreadsheet, Loader2 } from 'lucide-react'

import { clsxm } from '@/lib/clsxm'

import { type EtapeAttente, progressionOf } from './etapesAttente'

function EtapeIcone({ statut }: { statut: EtapeAttente['statut'] }) {
  if (statut === 'TERMINEE') {
    return (
      <span className="flex size-[22px] items-center justify-center rounded-full bg-success text-primary-foreground">
        <Check aria-hidden className="size-3.5" strokeWidth={3} />
      </span>
    )
  }
  if (statut === 'EN_COURS') {
    return <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
  }
  return <span className="size-[18px] rounded-full border-2 border-border-strong" />
}

function Etape({ etape, isFirst }: { etape: EtapeAttente; isFirst: boolean }) {
  const isPending = etape.statut === 'A_VENIR'
  return (
    <li
      className={clsxm(
        'flex items-start gap-3 py-3',
        !isFirst && 'border-t border-surface-tinted-strong',
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <EtapeIcone statut={etape.statut} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={clsxm(
            'text-sm leading-6',
            etape.statut === 'EN_COURS' ? 'font-bold' : 'font-medium',
            isPending ? 'text-text-muted' : 'text-text',
          )}
        >
          {etape.label}
        </p>
        {isPending ? null : (
          <p className="mt-px animate-[fadeInUp_240ms_ease-out] text-[13px] leading-[18px] text-text-muted">
            {etape.detail}
          </p>
        )}
      </div>
    </li>
  )
}

// Écran d'attente pendant que l'assistant IA construit le plan de transformation :
// les étapes affichées sont celles que le serveur diffuse.
export function ImportAttente({
  nomFichier,
  nombreLignes,
  nombreColonnes,
  etapes,
}: {
  nomFichier: string
  nombreLignes: number
  nombreColonnes: number
  etapes: ReadonlyArray<EtapeAttente>
}) {
  const progression = progressionOf(etapes)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-[10px] border border-border px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-tinted text-success">
          <FileSpreadsheet aria-hidden className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{nomFichier}</p>
          <p className="text-xs text-text-muted">
            {nombreLignes} {pluralize({ count: nombreLignes, singular: 'ligne', plural: 'lignes' })}{' '}
            · {nombreColonnes}{' '}
            {pluralize({ count: nombreColonnes, singular: 'colonne', plural: 'colonnes' })}
          </p>
        </div>
        <span className="rounded-full bg-primary-tinted px-2.5 py-1 text-xs font-medium text-primary">
          Format libre
        </span>
      </div>

      <p className="text-sm leading-[22px] text-text">
        Ce fichier n’a pas les colonnes attendues. L’assistant IA le lit pour le mettre au format de
        l’indicateur. Vous vérifierez le résultat avant d’importer.
      </p>

      <ol
        aria-live="polite"
        className="rounded-xl border border-border bg-surface-tinted px-4 py-2"
      >
        {etapes.map((etape, index) => (
          <Etape key={etape.id} etape={etape} isFirst={index === 0} />
        ))}
      </ol>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Avancement de la lecture du fichier"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progression}
          className="h-1 flex-1 overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progression}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-xs text-text-muted">
          En général moins d’une minute
        </span>
      </div>
    </div>
  )
}
