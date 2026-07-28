import { Lock } from 'lucide-react'

import { Button } from '@pilote/kpilote-ui/Button'
import { clsxm } from '@/lib/clsxm'

// Entête de section administrable : titre, état du verrou de production et
// bandeau de déverrouillage. Le hook `useProdEditUnlock` reste appelé par le
// parent, qui a besoin de `locked` pour désactiver ses contrôles : l'appeler
// ici aussi créerait deux états indépendants.
export function ProdEditSectionHeader({
  titre,
  isProd,
  locked,
  onUnlock,
}: {
  titre: string
  isProd: boolean
  locked: boolean
  onUnlock: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{titre}</h2>
        {isProd ? (
          <span
            className={clsxm(
              'text-xs font-medium',
              locked ? 'text-red-marianne' : 'text-text-muted',
            )}
          >
            {locked ? 'Édition verrouillée (PROD)' : 'Édition déverrouillée (PROD)'}
          </span>
        ) : null}
      </div>

      {locked ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-marianne/40 bg-red-marianne/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-text">
            <Lock className="size-4 text-red-marianne" /> Modifications désactivées en production.
          </span>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (window.confirm("Déverrouiller l'édition des collections en PRODUCTION ?"))
                onUnlock()
            }}
            className="border-red-marianne bg-red-marianne text-primary-foreground hover:bg-red-marianne"
          >
            Déverrouiller l'édition en PROD
          </Button>
        </div>
      ) : null}
    </>
  )
}
