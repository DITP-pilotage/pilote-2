import { fonctionLabel } from '@/lib/axeArbre'
import { type AxeCroise } from '@/lib/axesCroises'

export function AxesOrder({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  return (
    <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 text-xs">
      {axes.map((axe, index) => (
        <li key={axe.id} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-text-subtle">puis</span> : null}
          <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5">
            <b>
              {index + 1}. {axe.nom}
            </b>{' '}
            <span className="text-text-muted">({fonctionLabel(axe.fonction)})</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
