import { useQuery } from '@tanstack/react-query'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { clsxm } from '@/lib/clsxm'
import type { OpenapiEndpoint } from '@/queries/console'
import { openapiEndpointsQueryOptions } from '@/queries/console'

export function EndpointPicker({ onSelect }: { onSelect: (endpoint: OpenapiEndpoint) => void }) {
  const { data, isPending, isError } = useQuery(openapiEndpointsQueryOptions)

  return (
    <div className="flex flex-col gap-1">
      <Picker
        items={data ?? []}
        onSelect={onSelect}
        disabled={isPending || isError}
        getKey={(endpoint) => `${endpoint.method} ${endpoint.path}`}
        getSearchText={(endpoint) => `${endpoint.method} ${endpoint.path} ${endpoint.summary}`}
        triggerLabel={isPending ? 'Chargement des endpoints…' : 'Rechercher un endpoint (OpenAPI)…'}
        searchPlaceholder="Rechercher un endpoint…"
        emptyLabel="Aucun endpoint trouvé."
        renderItem={(endpoint) => (
          <>
            <span
              className={clsxm(
                'w-14 shrink-0 text-xs font-bold',
                endpoint.method === 'GET' ? 'text-primary' : 'text-accent-rouge',
              )}
            >
              {endpoint.method}
            </span>
            <span className="font-mono text-xs">{endpoint.path}</span>
            {endpoint.summary ? (
              <span className="truncate text-xs text-text-muted">{endpoint.summary}</span>
            ) : null}
          </>
        )}
      />

      {isError ? (
        <p className="text-xs text-text-muted">OpenAPI indisponible — saisie manuelle possible.</p>
      ) : null}
    </div>
  )
}
