import type { IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  IndicateurAvancement,
  IndicateurAvancementSkeleton,
} from '@/components/indicateurs/IndicateurAvancement'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'

export type IndicateurCardContext = {
  // Individu résolu pour cet indicateur (publicId) — sert à l'affichage de l'avancement.
  individu: string
  // Sélection complète par ensemble (search `individus`), propagée telle quelle
  // au détail : la page détail y résout l'individu de son propre ensemble.
  individus?: string | undefined
}

export function IndicateurCard({
  indicateur,
  context,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'unite'>
  context?: IndicateurCardContext | undefined
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      body={
        context ? (
          <Suspense fallback={<IndicateurAvancementSkeleton />}>
            <IndicateurAvancement
              indicateurId={indicateur.id}
              individuId={context.individu}
              unite={indicateur.unite}
            />
          </Suspense>
        ) : undefined
      }
    >
      <Link
        to="/indicateurs/$id"
        params={{ id: indicateur.id }}
        search={context ? { individus: context.individus } : {}}
      />
    </EntityCard>
  )
}
