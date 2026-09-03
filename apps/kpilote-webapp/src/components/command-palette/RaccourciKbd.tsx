import { useSyncExternalStore } from 'react'

import { clsxm } from '@/lib/clsxm'
import { estApple } from '@/lib/plateforme'

// La plateforme ne change jamais en cours de session : rien à écouter.
const subscribe = () => () => {}
const getRaccourci = () => (estApple() ? '⌘K' : 'Ctrl+K')
// Snapshot serveur = 1er rendu client (avant hydratation) → pas de mismatch.
const getRaccourciServeur = () => 'Ctrl+K'

/**
 * Le libellé du raccourci ⌘K adapté à la plateforme. Source unique de vérité,
 * partagée par le badge du header et par le pied de la palette.
 *
 * `useSyncExternalStore` lit la plateforme côté client tout en fournissant un
 * snapshot serveur stable, ce qui évite tout mismatch d'hydratation SSR.
 */
export function useRaccourciPalette(): string {
  return useSyncExternalStore(subscribe, getRaccourci, getRaccourciServeur)
}

/** Affiche le raccourci d'ouverture de la palette : « ⌘K » sur Apple, « Ctrl+K » ailleurs. */
export function RaccourciKbd({ className }: { className?: string }) {
  const raccourci = useRaccourciPalette()

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
