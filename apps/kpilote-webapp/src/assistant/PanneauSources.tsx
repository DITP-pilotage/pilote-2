import type { Source } from '@pilote/kpilote-shared/assistant/sources'
import { Link } from '@tanstack/react-router'

export function PanneauSources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <section aria-label="Sources consultées" className="mt-3 border-t border-border pt-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-subtle">Sources</h3>
      <ul className="mt-1 flex flex-wrap gap-2">
        {sources.map((source) => {
          const contenu = (
            <>
              <span>{source.libelle}</span>
              <span className="font-mono text-xs text-text-subtle">{source.publicId}</span>
            </>
          )
          return (
            <li key={`${source.type}:${source.publicId}`}>
              {/* Individus et référentiels n'ont pas de page de détail : affichés sans lien
                  plutôt qu'omis, sinon une réponse bien sourcée afficherait « aucune source ». */}
              {source.chemin ? (
                <Link
                  to={source.chemin}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-sm hover:bg-surface"
                >
                  {contenu}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-sm text-text-subtle">
                  {contenu}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
