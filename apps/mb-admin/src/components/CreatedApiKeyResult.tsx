import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

export function CreatedApiKeyResult({
  rawKey,
  label,
  onDone,
}: {
  rawKey: string
  label: string
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard
      .writeText(rawKey)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => setCopied(false))
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">Clé « {label} » créée</h2>
        <p className="mt-1 text-sm font-medium text-accent">
          ⚠️ Copiez la clé maintenant : elle ne sera plus jamais affichée.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2.5">
          <code className="flex-1 break-all font-mono text-sm">{rawKey}</code>
          <button type="button" onClick={copy} className="text-primary" aria-label="Copier la clé">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={onDone}>
          Terminer
        </Button>
      </div>
    </div>
  )
}
