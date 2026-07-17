import { clsxm } from '@/lib/clsxm'
import type { HistoryEntry } from '@/lib/consoleHistory'

export function HistoryList({
  entries,
  onRestore,
  onClear,
}: {
  entries: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Historique
        </h2>
        {entries.length > 0 ? (
          <button type="button" onClick={onClear} className="text-xs text-primary">
            Vider
          </button>
        ) : null}
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-text-muted">Aucun appel récent.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="flex w-full items-center gap-2 rounded-md border border-border px-2 py-1.5 text-left text-xs hover:bg-surface-muted"
              >
                <span
                  className={clsxm(
                    'w-12 shrink-0 font-bold',
                    entry.method === 'GET' ? 'text-primary' : 'text-red-marianne',
                  )}
                >
                  {entry.method}
                </span>
                <span className="flex-1 truncate font-mono">{entry.path}</span>
                <span className="text-text-muted">{entry.status || '—'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
