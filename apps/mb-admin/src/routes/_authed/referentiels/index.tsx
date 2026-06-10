import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/referentiels/')({ component: ReferentielsStub })

function ReferentielsStub() {
  return (
    <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
      <p className="text-lg font-semibold text-text">Référentiels</p>
      <p className="mt-2 text-sm">Écran à venir (Plan 3).</p>
    </div>
  )
}
