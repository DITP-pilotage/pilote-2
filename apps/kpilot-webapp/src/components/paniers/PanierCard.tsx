import type { PanierApiModel } from '@pilote/kpilot-shared/panier'
import { Link } from '@tanstack/react-router'

import { EntityCard } from '@/components/ui/EntityCard'

export type PanierCardContext = {
  individu: string
  referentiel: string
}

export function PanierCard({
  panier,
  context,
}: {
  panier: Pick<PanierApiModel, 'id' | 'nom' | 'description' | 'indicateurIds'>
  context?: PanierCardContext | undefined
}) {
  const nb = panier.indicateurIds.length
  return (
    <EntityCard
      asChild
      kicker={panier.id}
      title={panier.nom}
      footer={
        <>
          {nb} indicateur{nb > 1 ? 's' : ''}
          {panier.description ? ` — ${panier.description}` : ''}
        </>
      }
    >
      <Link to="/paniers/$id" params={{ id: panier.id }} search={context ?? {}} />
    </EntityCard>
  )
}
