import type { PanierApiModel } from '@pilote/mb-shared/panier'
import { Link } from '@tanstack/react-router'

import { EntityCard } from '@/components/ui/EntityCard'

type PanierCardProps = {
  panier: Pick<PanierApiModel, 'id' | 'nom' | 'description' | 'indicateurIds'>
}

export function PanierCard({ panier }: PanierCardProps) {
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
      <Link to="/paniers/$id" params={{ id: panier.id }} />
    </EntityCard>
  )
}
