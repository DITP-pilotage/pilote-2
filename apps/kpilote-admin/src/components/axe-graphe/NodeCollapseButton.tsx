import { ChevronLeft, ChevronRight } from 'lucide-react'

import { type PlacedNode } from '@/lib/axeGraphe'

// Le graphe calcule ses positions à plat depuis les parentes repliées : il n'y a pas de
// conteneur à replier, seulement un bouton qui bascule l'état.
export function NodeCollapseButton({ node, onToggle }: { node: PlacedNode; onToggle: () => void }) {
  const isCollapsed = node.hidden > 0
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? 'Déplier' : 'Replier'}
      className="absolute top-1/2 -left-3 z-10 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border border-border-strong bg-surface px-1 text-[11px] font-semibold text-text-muted shadow-sm hover:border-primary hover:text-primary"
    >
      {isCollapsed ? (
        <>
          <ChevronLeft className="size-3.5" />
          {node.hidden}
        </>
      ) : (
        <ChevronRight className="size-3.5" />
      )}
    </button>
  )
}
