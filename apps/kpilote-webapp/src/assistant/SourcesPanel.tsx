import type { Source, SourceType } from '@pilote/kpilote-shared/assistant/sources'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'

// Ordre d'affichage : le sujet de la réponse d'abord, son cadrage ensuite.
const DISPLAY_ORDER: ReadonlyArray<SourceType> = [
  'indicateur',
  'collection',
  'referentiel',
  'individu',
]

const TYPE_LABELS: Record<SourceType, { singular: string; plural: string }> = {
  indicateur: { singular: 'Indicateur', plural: 'Indicateurs' },
  collection: { singular: 'Collection', plural: 'Collections' },
  referentiel: { singular: 'Référentiel', plural: 'Référentiels' },
  individu: { singular: 'Territoire', plural: 'Territoires' },
}

function SourceChip({ source }: { source: Source }) {
  const content = (
    <>
      <span className="truncate">{source.label}</span>
      <span className="shrink-0 font-mono text-[11px] text-text-subtle">{source.publicId}</span>
    </>
  )
  const baseClasses =
    'inline-flex max-w-full items-baseline gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-sm'

  // Territoires et référentiels n'ont pas de page de détail : affichés sans lien plutôt
  // qu'omis, sinon une réponse bien sourcée afficherait « aucune source ».
  return source.path ? (
    <Link
      to={source.path}
      className={clsxm(baseClasses, 'hover:border-border-strong hover:bg-surface')}
    >
      {content}
    </Link>
  ) : (
    <span className={clsxm(baseClasses, 'text-text-muted')}>{content}</span>
  )
}

export function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)

  if (sources.length === 0) return null

  const groups = DISPLAY_ORDER.map((type) => ({
    type,
    sources: sources.filter((source) => source.type === type),
  })).filter((group) => group.sources.length > 0)

  return (
    <section className="mt-3 rounded-lg border border-border bg-surface-tinted">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted hover:text-text"
      >
        <ChevronRight
          aria-hidden
          className={clsxm('size-4 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span className="font-medium">
          {sources.length} source{sources.length > 1 ? 's' : ''} consultée
          {sources.length > 1 ? 's' : ''}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
          {groups.map((group) => (
            <div key={group.type} className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                {group.sources.length > 1
                  ? TYPE_LABELS[group.type].plural
                  : TYPE_LABELS[group.type].singular}
              </h4>
              <ul className="flex flex-wrap gap-1.5">
                {group.sources.map((source) => (
                  <li key={source.publicId} className="max-w-full">
                    <SourceChip source={source} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
