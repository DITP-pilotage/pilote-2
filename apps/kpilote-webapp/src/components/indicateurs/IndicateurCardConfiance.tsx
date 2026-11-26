import { Suspense } from 'react'

import { IndicateurCardNiveauConfiance } from '@/components/indicateurs/IndicateurCardNiveauConfiance'
import { ErrorBoundary } from '@pilote/kpilote-ui/ErrorBoundary'
import { Text } from '@pilote/kpilote-ui/Typography'

// Lue à part de la valeur et de la cible : si la confiance ne se charge pas, la
// carte garde ses autres blocs.
export function IndicateurCardConfiance({
  indicateurId,
  individus,
}: {
  indicateurId: string
  individus: ReadonlyArray<string> | undefined
}) {
  return (
    <div className="border-t border-border pt-4">
      <Text variant="kicker" tone="muted" as="p">
        Indice de confiance
      </Text>
      <ErrorBoundary
        fallback={
          <Text variant="body" tone="muted" className="mt-2">
            Indisponible
          </Text>
        }
      >
        <Suspense
          fallback={<span className="mt-2 block h-6 w-48 animate-pulse rounded bg-border" />}
        >
          <IndicateurCardNiveauConfiance indicateurId={indicateurId} individus={individus} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
