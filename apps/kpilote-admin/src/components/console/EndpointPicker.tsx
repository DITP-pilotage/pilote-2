import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import type { OpenapiEndpoint } from '@/queries/console'
import { openapiEndpointsQueryOptions } from '@/queries/console'

export function EndpointPicker({ onSelect }: { onSelect: (endpoint: OpenapiEndpoint) => void }) {
  const { data, isPending, isError } = useQuery(openapiEndpointsQueryOptions)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const endpoints = data ?? []
  const filtered = search.trim()
    ? endpoints.filter((endpoint) =>
        `${endpoint.method} ${endpoint.path} ${endpoint.summary}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : endpoints

  return (
    <div className="relative">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={isPending ? 'Chargement des endpoints…' : 'Rechercher un endpoint (OpenAPI)…'}
        className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
      />
      {isError ? (
        <p className="mt-1 text-xs text-text-muted">
          OpenAPI indisponible — saisie manuelle possible.
        </p>
      ) : null}
      {open && filtered.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-white shadow-lg">
          {filtered.slice(0, 100).map((endpoint) => (
            <li key={`${endpoint.method} ${endpoint.path}`}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  onSelect(endpoint)
                  setSearch('')
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span
                  className={clsxm(
                    'w-14 shrink-0 text-xs font-bold',
                    endpoint.method === 'GET' ? 'text-primary' : 'text-accent',
                  )}
                >
                  {endpoint.method}
                </span>
                <span className="font-mono text-xs">{endpoint.path}</span>
                {endpoint.summary ? (
                  <span className="truncate text-xs text-text-muted">{endpoint.summary}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
