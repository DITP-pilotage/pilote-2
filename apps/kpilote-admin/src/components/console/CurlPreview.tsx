import { useFormContext, useWatch } from 'react-hook-form'

import { CopyButton } from '@/components/ui/CopyButton'
import type { ConsoleFormValues } from '@/lib/consoleForm'
import { toCurl } from '@/lib/toCurl'

// Aperçu de la commande curl équivalente, dérivé en direct des valeurs du form.
export function CurlPreview({ baseUrl }: { baseUrl: string }) {
  const { control } = useFormContext<ConsoleFormValues>()
  const [method, path, headers, body] = useWatch({
    control,
    name: ['method', 'path', 'headers', 'body'],
  })

  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const curl = toCurl({ method, url, headers, body })

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2">
      <code className="flex-1 overflow-auto whitespace-pre text-xs">{curl}</code>
      <CopyButton value={curl} label="Copier la commande curl" />
    </div>
  )
}
