import { useQuery } from '@tanstack/react-query'
import { Command } from 'cmdk'
import { ChevronDown, Search } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import type { OpenapiEndpoint } from '@/queries/console'
import { openapiEndpointsQueryOptions } from '@/queries/console'

// Filtre par sous-chaîne (méthode + path + résumé), prévisible plutôt que le
// scoring fuzzy par défaut de cmdk.
const commandFilter = (itemValue: string, query: string): number => {
  const needle = query.trim().toLowerCase()
  if (!needle) return 1
  return itemValue.toLowerCase().includes(needle) ? 1 : 0
}

export function EndpointPicker({ onSelect }: { onSelect: (endpoint: OpenapiEndpoint) => void }) {
  const { data, isPending, isError } = useQuery(openapiEndpointsQueryOptions)
  const [open, setOpen] = useState(false)
  const endpoints = data ?? []

  return (
    <div className="flex flex-col gap-1">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          disabled={isPending || isError}
          className={clsxm(
            'flex w-full items-center gap-2 rounded-md border border-border px-3 py-2.5 text-left text-sm',
            'hover:border-primary focus-visible:border-primary focus-visible:outline-none',
            'data-[state=open]:border-primary disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <Search className="size-4 shrink-0 text-text-muted" />
          <span className="flex-1 truncate text-text-subtle">
            {isPending ? 'Chargement des endpoints…' : 'Rechercher un endpoint (OpenAPI)…'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-text-muted" />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-lg"
          >
            <Command label="Rechercher un endpoint" filter={commandFilter}>
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="size-4 shrink-0 text-text-muted" />
                <Command.Input
                  autoFocus
                  placeholder="Rechercher un endpoint…"
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-text-subtle"
                />
              </div>
              <Command.List className="max-h-72 overflow-y-auto p-1.5">
                <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
                  Aucun endpoint trouvé.
                </Command.Empty>
                {endpoints.map((endpoint) => (
                  <Command.Item
                    key={`${endpoint.method} ${endpoint.path}`}
                    value={`${endpoint.method} ${endpoint.path} ${endpoint.summary}`}
                    onSelect={() => {
                      onSelect(endpoint)
                      setOpen(false)
                    }}
                    className={clsxm(
                      'flex cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none',
                      'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
                    )}
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
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {isError ? (
        <p className="text-xs text-text-muted">OpenAPI indisponible — saisie manuelle possible.</p>
      ) : null}
    </div>
  )
}
