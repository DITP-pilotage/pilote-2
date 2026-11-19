import { edgePathOf } from '@/lib/axeGraphe'
import { clsxm } from '@/lib/clsxm'

export function GraphEdge({
  from,
  to,
  nodeWidth,
  isOn,
  isDimmed,
  isDashed = false,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  nodeWidth: number
  isOn: boolean
  isDimmed: boolean
  isDashed?: boolean
}) {
  return (
    <path
      d={edgePathOf({ from, to, nodeWidth })}
      fill="none"
      markerEnd={`url(#fleche-${isOn ? 'on' : 'off'})`}
      strokeDasharray={isDashed ? '4 4' : undefined}
      className={clsxm(
        'transition-opacity',
        isOn ? 'stroke-primary' : 'stroke-border-strong',
        isDimmed && 'opacity-25',
      )}
      strokeWidth={isOn ? 2 : 1.25}
    />
  )
}
