import { type ReferenceLine } from '@/lib/axes/explicationCellule'

export function CelluleReference({
  lines,
  periode,
}: {
  lines: ReadonlyArray<ReferenceLine>
  periode: string
}) {
  return (
    <dl className="m-0 flex flex-col gap-0.5 py-2">
      {lines.map((line) => (
        <div key={line.label} className="flex min-w-0 gap-1">
          <dt className="shrink-0 whitespace-nowrap text-text-subtle">{line.label} :</dt>
          <dd className="m-0 min-w-0 truncate text-text" title={line.value}>
            {line.value}
          </dd>
        </div>
      ))}
      <div className="flex gap-1">
        <dt className="shrink-0 whitespace-nowrap text-text-subtle">Période :</dt>
        <dd className="m-0 text-text">{periode}</dd>
      </div>
    </dl>
  )
}
