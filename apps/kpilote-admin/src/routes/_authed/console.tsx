import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import {
  HTTP_METHODS,
  sendConsoleRequest,
  type ConsoleResponse,
  type HeaderPair,
  type HttpMethod,
} from '@/api/console'
import { EndpointPicker } from '@/components/console/EndpointPicker'
import { HeadersEditor } from '@/components/console/HeadersEditor'
import { HistoryList } from '@/components/console/HistoryList'
import { ResponsePanel } from '@/components/console/ResponsePanel'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { formatJson, JsonEditor } from '@/components/ui/JsonEditor'
import { TabNav } from '@/components/ui/TabNav'
import { clearHistory, loadHistory, pushHistory, type HistoryEntry } from '@/lib/consoleHistory'
import { toCurl } from '@/lib/toCurl'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { consoleMetaQueryOptions } from '@/queries/console'

export const Route = createFileRoute('/_authed/console')({ component: ConsoleComponent })

const MUTATING: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])

function ConsoleComponent() {
  const { data: meta } = useQuery(consoleMetaQueryOptions)
  const { isProd, locked, unlock } = useProdEditUnlock()

  const [method, setMethod] = useState<HttpMethod>('GET')
  const [path, setPath] = useState('')
  const [headers, setHeaders] = useState<HeaderPair[]>([])
  const [body, setBody] = useState('')
  const [tab, setTab] = useState<'body' | 'headers'>('body')

  const [response, setResponse] = useState<ConsoleResponse | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const baseUrl = (meta?.baseUrl ?? '').replace(/\/$/, '')
  const fullUrl = `${baseUrl}/${path.replace(/^\/+/, '')}`
  const blockedByProd = isProd && locked && MUTATING.has(method)

  const curl = toCurl({ method, url: fullUrl, headers, body })

  const send = async () => {
    setPending(true)
    setError(null)
    try {
      const request = { method, path, headers, body }
      const result = await sendConsoleRequest(request)
      setResponse(result)
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        method,
        path,
        status: result.status,
        ts: Date.now(),
        request,
      }
      setHistory(pushHistory(entry))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Échec de l’appel')
    } finally {
      setPending(false)
    }
  }

  const restore = (entry: HistoryEntry) => {
    setMethod(entry.request.method)
    setPath(entry.request.path)
    setHeaders(entry.request.headers)
    setBody(entry.request.body)
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeading title="Console API" subtitle={`Environnement : ${meta?.environment ?? '…'}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <EndpointPicker
            onSelect={(endpoint) => {
              setMethod(endpoint.method)
              setPath(endpoint.path)
              if (endpoint.bodyExample) {
                setBody(endpoint.bodyExample)
                setTab('body')
              }
            }}
          />

          <div className="flex items-end gap-2">
            <FieldSelect
              label="Méthode"
              hideLabel
              value={method}
              onChange={(event) => setMethod(event.target.value as HttpMethod)}
              className="w-32"
            >
              {HTTP_METHODS.map((httpMethod) => (
                <option key={httpMethod} value={httpMethod}>
                  {httpMethod}
                </option>
              ))}
            </FieldSelect>
            <div className="flex flex-1 items-center rounded-md border border-border">
              <span className="max-w-[45%] truncate px-2 py-2.5 text-xs text-text-muted">
                {baseUrl}/
              </span>
              <input
                aria-label="Chemin de la requête"
                value={path}
                onChange={(event) => setPath(event.target.value.replace(/^\/+/, ''))}
                placeholder="indicateurs?limit=10"
                className="flex-1 rounded-r-md px-2 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <Button type="button" onClick={() => void send()} disabled={pending || blockedByProd}>
              Envoyer
            </Button>
          </div>

          {blockedByProd ? (
            <div className="flex items-center justify-between rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-xs">
              <span>Mutation sur la prod verrouillée.</span>
              <button type="button" onClick={unlock} className="font-semibold text-accent">
                Déverrouiller
              </button>
            </div>
          ) : null}

          <div>
            <TabNav
              tabs={[
                { key: 'body', label: 'Body' },
                { key: 'headers', label: 'En-têtes' },
              ]}
              active={tab}
              onChange={(key) => setTab(key as 'body' | 'headers')}
            />
            {tab === 'body' ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    onClick={() => setBody((value) => formatJson(value))}
                  >
                    Formater
                  </Button>
                </div>
                <JsonEditor value={body} onChange={setBody} ariaLabel="Corps de la requête" />
              </div>
            ) : (
              <HeadersEditor headers={headers} onChange={setHeaders} />
            )}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2">
            <code className="flex-1 overflow-auto whitespace-pre text-xs">{curl}</code>
            <CopyButton value={curl} label="Copier la commande curl" />
          </div>

          <div className="rounded-md border border-border p-4">
            <ResponsePanel response={response} pending={pending} error={error} />
          </div>
        </div>

        <aside className="rounded-md border border-border p-3">
          <HistoryList
            entries={history}
            onRestore={restore}
            onClear={() => {
              clearHistory()
              setHistory([])
            }}
          />
        </aside>
      </div>
    </div>
  )
}
