import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { searchPaniersInfiniteQueryOptions } from '@/queries/permissions'

export type PanierHit = { publicId: string; nom: string }

export function PanierSearchModal({
  excludedPublicIds,
  onSelect,
  onClose,
}: {
  excludedPublicIds: string[]
  onSelect: (hit: PanierHit) => void
  onClose: () => void
}) {
  const [recherche, setRecherche] = useState('')
  const [rechercheIdentifiant, setRechercheIdentifiant] = useState('')
  const excluded = new Set(excludedPublicIds)

  const query = useInfiniteQuery(searchPaniersInfiniteQueryOptions(recherche, rechercheIdentifiant))

  const hits: PanierHit[] = (query.data?.pages ?? [])
    .flatMap((page) => page.hits)
    .filter((hit) => !excluded.has(hit.publicId))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Ajouter un panier</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-muted hover:text-text"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label
              htmlFor="panier-search-identifiant"
              className="mb-1.5 block text-xs font-semibold"
            >
              Identifiant
            </label>
            <input
              id="panier-search-identifiant"
              autoFocus
              placeholder="Identifiant"
              value={rechercheIdentifiant}
              onChange={(event) => setRechercheIdentifiant(event.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="panier-search-nom" className="mb-1.5 block text-xs font-semibold">
              Nom
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
              <input
                id="panier-search-nom"
                placeholder="Nom du panier…"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.isLoading ? (
            <p className="py-6 text-center text-sm text-text-muted">Chargement…</p>
          ) : hits.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun résultat.</p>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((hit) => (
                <li key={hit.publicId}>
                  <button
                    type="button"
                    onClick={() => onSelect(hit)}
                    className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left hover:bg-border/30"
                  >
                    <span className="truncate text-sm text-text">{hit.nom}</span>
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {hit.publicId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {query.hasNextPage ? (
          <div className="mt-3 text-center">
            <Button
              variant="tertiary"
              size="sm"
              type="button"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
