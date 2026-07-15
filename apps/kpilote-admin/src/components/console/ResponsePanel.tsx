import { useState } from 'react'

import type { ConsoleResponse } from '@/api/console'
import { formatJson, JsonEditor } from '@/components/ui/JsonEditor'
import { clsxm } from '@/lib/clsxm'

const statusTone = (status: number): string => {
  if (status >= 200 && status < 300) return 'bg-primary text-primary-foreground'
  if (status >= 400) return 'bg-accent text-white'
  return 'border border-border text-text-muted'
}

export function ResponsePanel({
  response,
  pending,
  error,
}: {
  response: ConsoleResponse | null
  pending: boolean
  error: string | null
}) {
  const [showHeaders, setShowHeaders] = useState(false)

  if (pending) return <p className="text-sm text-text-muted">Appel en cours…</p>
  if (error) return <p className="text-sm text-accent">{error}</p>
  if (!response) return <p className="text-sm text-text-muted">Aucune réponse pour l'instant.</p>

  const contentType = response.headers['content-type'] ?? ''
  const body = contentType.includes('json') ? formatJson(response.body) : response.body

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-sm">
        <span
          className={clsxm('rounded-full px-3 py-1 text-xs font-bold', statusTone(response.status))}
        >
          {response.status}
        </span>
        <span className="text-text-muted">{response.durationMs} ms</span>
        <button
          type="button"
          onClick={() => setShowHeaders((value) => !value)}
          className="text-xs text-primary"
        >
          {showHeaders ? 'Masquer' : 'Afficher'} les en-têtes
        </button>
      </div>
      {showHeaders ? (
        <pre className="overflow-auto rounded-md border border-border bg-surface-muted p-3 text-xs">
          {Object.entries(response.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')}
        </pre>
      ) : null}
      <JsonEditor value={body} readOnly ariaLabel="Corps de la réponse" />
    </div>
  )
}
