import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { Pin } from 'lucide-react'

import { clsxm } from '@/lib/clsxm'
import { usePinIndicateur, useUnpinIndicateur } from '@/mutations/epingles'

// Épingle d'une carte d'indicateur : pleine et toujours visible sur un indicateur
// épinglé ; en trait seulement sur les autres, révélée au survol ou au focus de la
// carte (groupe `entity-card` d'EntityCard), et toujours visible sans souris.
export function IndicateurPinButton({
  indicateur,
  isPinned,
  source,
  onUnpinned,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom'>
  isPinned: boolean
  source: AnalyticsSource
  // Appelé une fois l'épingle retirée, par exemple pour replacer le focus
  // quand la carte quitte la section des épinglés.
  onUnpinned?: () => void
}) {
  const pin = usePinIndicateur()
  const unpin = useUnpinIndicateur()
  const variables = { indicateurId: indicateur.id, source }
  const label = isPinned
    ? `Désépingler l’indicateur ${indicateur.nom}`
    : `Épingler l’indicateur ${indicateur.nom}`

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isPinned}
      title={isPinned ? 'Désépingler' : 'Épingler'}
      disabled={pin.isPending || unpin.isPending}
      onClick={() => {
        if (isPinned) {
          unpin.mutate(variables, { onSuccess: () => onUnpinned?.() })
          return
        }
        pin.mutate(variables)
      }}
      className={clsxm(
        'flex size-8 items-center justify-center rounded-md text-primary transition',
        'hover:bg-primary-tinted focus-visible:opacity-100 disabled:cursor-wait',
        !isPinned &&
          'opacity-0 group-hover/entity-card:opacity-100 group-focus-within/entity-card:opacity-100 pointer-coarse:opacity-100',
      )}
    >
      <Pin className={clsxm('size-4', isPinned && 'fill-current')} aria-hidden />
    </button>
  )
}
