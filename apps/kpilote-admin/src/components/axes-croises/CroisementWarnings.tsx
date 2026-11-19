import { AlertTriangle } from 'lucide-react'

export function CroisementWarnings({ warnings }: { warnings: ReadonlyArray<string> }) {
  if (warnings.length === 0) return null
  return (
    <ul className="m-0 flex flex-col gap-1 border-b border-border bg-warning-tinted px-6 py-2 text-xs text-warning">
      {warnings.map((warning) => (
        <li key={warning} className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 shrink-0" />
          {warning}
        </li>
      ))}
    </ul>
  )
}
