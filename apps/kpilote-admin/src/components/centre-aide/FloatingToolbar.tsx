import type { ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

export function FloatingToolbar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      aria-label={label}
      className="absolute -top-10 left-0 z-10 flex items-center gap-0.5 rounded-lg bg-surface-inverse p-1 shadow-raised"
      contentEditable={false}
      role="group"
    >
      {children}
    </div>
  )
}

export function FloatingToolbarButton({
  isActive,
  label,
  onClick,
  children,
}: {
  isActive: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      // Empêche le blur : la sélection courante de l'éditeur reste active au clic.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsxm(
        'flex size-7 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15',
        isActive && 'bg-white/20 text-white',
      )}
    >
      {children}
    </button>
  )
}
