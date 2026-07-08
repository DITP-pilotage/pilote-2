import type { DossierApiModel } from '@pilote/kpilote-shared/dossier'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import { DossierAvancement, DossierAvancementSkeleton } from '@/components/dossiers/DossierAvancement'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'

export type DossierCardContext = {
  individu: string
  referentiel: string
}

export function DossierCard({
  dossier,
  context,
}: {
  dossier: Pick<DossierApiModel, 'id' | 'nom' | 'description' | 'indicateurIds'>
  context?: DossierCardContext | undefined
}) {
  const nb = dossier.indicateurIds.length
  return (
    <EntityCard
      asChild
      title={dossier.nom}
      body={
        context ? (
          <Suspense fallback={<DossierAvancementSkeleton />}>
            <DossierAvancement dossierId={dossier.id} individuId={context.individu} />
          </Suspense>
        ) : undefined
      }
      footer={
        <>
          {nb} indicateur{nb > 1 ? 's' : ''}
          {dossier.description ? ` — ${dossier.description}` : ''}
        </>
      }
    >
      <Link to="/dossiers/$id" params={{ id: dossier.id }} search={context ?? {}} />
    </EntityCard>
  )
}
