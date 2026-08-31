import type { Source, TypeSource } from '@pilote/kpilote-shared/assistant/sources'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'

// Ordre d'affichage : le sujet de la réponse d'abord, son cadrage ensuite.
const ORDRE: ReadonlyArray<TypeSource> = ['indicateur', 'collection', 'referentiel', 'individu']

const LIBELLES_TYPE: Record<TypeSource, { singulier: string; pluriel: string }> = {
  indicateur: { singulier: 'Indicateur', pluriel: 'Indicateurs' },
  collection: { singulier: 'Collection', pluriel: 'Collections' },
  referentiel: { singulier: 'Référentiel', pluriel: 'Référentiels' },
  individu: { singulier: 'Territoire', pluriel: 'Territoires' },
}

function Puce({ source }: { source: Source }) {
  const contenu = (
    <>
      <span className="truncate">{source.libelle}</span>
      <span className="shrink-0 font-mono text-[11px] text-text-subtle">{source.publicId}</span>
    </>
  )
  const classes =
    'inline-flex max-w-full items-baseline gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-sm'

  // Territoires et référentiels n'ont pas de page de détail : affichés sans lien plutôt
  // qu'omis, sinon une réponse bien sourcée afficherait « aucune source ».
  return source.chemin ? (
    <Link
      to={source.chemin}
      className={clsxm(classes, 'hover:border-border-strong hover:bg-surface')}
    >
      {contenu}
    </Link>
  ) : (
    <span className={clsxm(classes, 'text-text-muted')}>{contenu}</span>
  )
}

export function PanneauSources({ sources }: { sources: Source[] }) {
  const [ouvert, setOuvert] = useState(false)

  if (sources.length === 0) return null

  const groupes = ORDRE.map((type) => ({
    type,
    sources: sources.filter((source) => source.type === type),
  })).filter((groupe) => groupe.sources.length > 0)

  return (
    <section className="mt-3 rounded-lg border border-border bg-surface-tinted">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert((precedent) => !precedent)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted hover:text-text"
      >
        <ChevronRight
          aria-hidden
          className={clsxm('size-4 shrink-0 transition-transform', ouvert && 'rotate-90')}
        />
        <span className="font-medium">
          {sources.length} source{sources.length > 1 ? 's' : ''} consultée
          {sources.length > 1 ? 's' : ''}
        </span>
      </button>

      {ouvert ? (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
          {groupes.map((groupe) => (
            <div key={groupe.type} className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                {groupe.sources.length > 1
                  ? LIBELLES_TYPE[groupe.type].pluriel
                  : LIBELLES_TYPE[groupe.type].singulier}
              </h4>
              <ul className="flex flex-wrap gap-1.5">
                {groupe.sources.map((source) => (
                  <li key={source.publicId} className="max-w-full">
                    <Puce source={source} />
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
