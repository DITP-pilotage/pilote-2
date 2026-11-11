import {
  Calculator,
  CircleHelp,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Scale,
  Search,
  Sparkles,
  Target,
} from 'lucide-react'

import { ASSISTANT_NAME } from '../AssistantSignature'
import type { Proposition } from './propositions'

const ICONS: Record<string, LucideIcon> = {
  synthese: FileText,
  dashboard: LayoutDashboard,
  comparaison: Scale,
  calcul: Calculator,
  ecarts: Target,
  trouver: Search,
  aide: CircleHelp,
}

const iconOf = (proposition: Proposition): LucideIcon =>
  ICONS[proposition.id.split('_')[0] ?? ''] ?? Sparkles

/** L'accueil d'une conversation vide : ce que sait faire l'assistant et par où commencer. */
export function EmptyState({
  propositions,
  onChoose,
}: {
  propositions: Proposition[]
  onChoose: (proposition: Proposition) => void
}) {
  return (
    <div className="@container mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-7 py-6">
      <div className="flex flex-col gap-3">
        <span className="grid size-10 place-items-center bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </span>
        <h2 className="m-0 text-2xl leading-8 font-bold text-text">
          Bonjour, je suis l&apos;{ASSISTANT_NAME}.
        </h2>
        <p className="m-0 text-[15px] leading-6 text-text-muted">
          Je réponds à partir de vos données kpilote : indicateurs, collections, commentaires. Je
          rédige des synthèses, des comparaisons et des tableaux de bord. Choisissez un point de
          départ ou posez votre question.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 @md:grid-cols-2">
        {propositions.map((proposition) => {
          const Icon = iconOf(proposition)
          return (
            <button
              key={proposition.id}
              type="button"
              onClick={() => onChoose(proposition)}
              className="flex min-h-[76px] flex-col items-start gap-2 border border-border bg-surface p-3.5 text-left text-sm leading-5 font-medium text-text transition-colors hover:border-primary hover:bg-primary-tinted hover:text-primary"
            >
              <Icon className="size-4 text-primary" />
              {proposition.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
