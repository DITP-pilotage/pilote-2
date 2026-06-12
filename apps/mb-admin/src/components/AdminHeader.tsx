import { Link } from '@tanstack/react-router'
import { KeyRound, TriangleAlert } from 'lucide-react'

import { Marianne } from '@/components/ui/Marianne'
import { clsxm } from '@/lib/clsxm'
import type { SessionState } from '@/session'

const ENV_LABEL: Record<string, string> = { local: 'Local', dev: 'Dev', prod: 'Prod' }

export function AdminHeader({
  session,
  onLogout,
}: {
  session: SessionState
  onLogout?: () => void
}) {
  const isProd = session?.environment === 'prod'
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3 sm:px-10">
        <Link to="/" className="flex items-stretch gap-5 transition-opacity hover:opacity-80">
          <Marianne />
          <span className="hidden w-px bg-border sm:block" aria-hidden />
          <span className="hidden flex-col justify-center gap-0.5 sm:flex">
            <span className="text-xl font-bold uppercase leading-none tracking-tight">
              Pilote MB
            </span>
            <span className="text-sm text-text-muted">Console d'administration</span>
          </span>
        </Link>
        {session ? (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={clsxm(
                'flex items-center gap-1 rounded-full px-3 py-1 font-extrabold uppercase tracking-wide',
                isProd ? 'bg-accent text-white' : 'border border-border text-text-muted',
              )}
            >
              {isProd ? <TriangleAlert className="size-3" /> : null}
              {ENV_LABEL[session.environment]}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-text-muted">
              <KeyRound className="size-3" /> {session.label}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-primary/30 px-3 py-1 font-semibold text-primary"
            >
              Changer
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
