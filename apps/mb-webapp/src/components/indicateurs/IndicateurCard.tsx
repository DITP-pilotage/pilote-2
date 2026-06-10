import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  IndicateurAvancement,
  IndicateurAvancementSkeleton,
} from '@/components/indicateurs/IndicateurAvancement'
import { EntityCard } from '@/components/ui/EntityCard'
import { formatMonthYearNumericFr } from '@/lib/format'

function formatMiseAJour(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return formatMonthYearNumericFr(date)
}

export type IndicateurCardContext = {
  individu: string
  referentiel: string
}

export function IndicateurCard({
  indicateur,
  context,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'updatedAt' | 'unite'>
  context?: IndicateurCardContext | undefined
}) {
  const footer = context ? (
    <Suspense fallback={<IndicateurAvancementSkeleton />}>
      <IndicateurAvancement
        indicateurId={indicateur.id}
        individuId={context.individu}
        unite={indicateur.unite}
      />
    </Suspense>
  ) : (
    <>Mis à jour {formatMiseAJour(indicateur.updatedAt)}</>
  )

  return (
    <EntityCard asChild title={indicateur.nom} footer={footer}>
      <Link to="/indicateurs/$id" params={{ id: indicateur.id }} search={context ?? {}} />
    </EntityCard>
  )
}
