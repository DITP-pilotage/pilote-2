import { ChevronDown, ChevronRight } from 'lucide-react'

// Replie ou déplie une parente d'une ligne du tableau. Les lignes sont calculées à plat depuis
// les parentes repliées : il n'y a pas de conteneur à replier.
export function CollapseButton({
  nom,
  isCollapsed,
  onToggle,
}: {
  nom: string
  isCollapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? `Déplier ${nom}` : `Replier ${nom}`}
      className="flex size-5 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-primary"
    >
      {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
    </button>
  )
}
