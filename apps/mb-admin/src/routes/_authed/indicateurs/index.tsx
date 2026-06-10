import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/indicateurs/')({ component: IndicateursStub })

function IndicateursStub() {
  return (
    <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
      <p className="text-lg font-semibold text-text">Indicateurs</p>
      <p className="mt-2 text-sm">Écran à venir (Plan 2).</p>
    </div>
  )
}
