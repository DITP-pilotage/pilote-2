import { useSyncExternalStore } from 'react'

import { clsxm } from '@/lib/clsxm'
import { estApple } from '@/lib/plateforme'

// La plateforme ne change jamais en cours de session : rien à écouter.
const subscribe = () => () => {}
const getRaccourci = () => (estApple() ? '⌘K' : 'Ctrl+K')
// Snapshot serveur = 1er rendu client (avant hydratation) → pas de mismatch.
const getRaccourciServeur = () => 'Ctrl+K'

/**
 * Affiche le raccourci d'ouverture de la palette, adapté à la plateforme :
 * « ⌘K » sur Apple, « Ctrl+K » ailleurs. Source unique de vérité pour ce label.
 *
 * `useSyncExternalStore` lit la plateforme côté client tout en fournissant un
 * snapshot serveur stable, ce qui évite tout mismatch d'hydratation SSR.
 */
export function RaccourciKbd({ className }: { className?: string }) {
  const raccourci = useSyncExternalStore(subscribe, getRaccourci, getRaccourciServeur)

  return (
    <kbd
      className={clsxm(
        'rounded border border-border bg-surface-tinted px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted',
        className,
      )}
    >
      {raccourci}
    </kbd>
  )
}
