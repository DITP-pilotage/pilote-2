import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { X } from 'lucide-react'
import { useState } from 'react'

import { analytics } from '@/analytics/tracker'

// Masqué pour la durée de l'onglet : il ne revient pas à chaque changement de vue.
const KEY = 'kpilote-assistant:bandeau'

const readHidden = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === 'masque'
  } catch {
    return false
  }
}

const writeHidden = (): void => {
  try {
    sessionStorage.setItem(KEY, 'masque')
  } catch {
    // Stockage indisponible : le bandeau reviendra à la prochaine ouverture.
  }
}

export function ExperimentationBanner({ compact }: { compact: boolean }) {
  const [hidden, setHidden] = useState(readHidden)
  if (hidden) return null

  return (
    <div
      className={clsxm(
        'flex shrink-0 items-center border-t border-border bg-primary-tinted text-text-muted',
        compact
          ? 'gap-2 py-1 pr-1 pl-3 text-[11px] leading-4'
          : 'min-h-9 gap-3 px-4 py-1 text-xs leading-[18px]',
      )}
    >
      <span className="shrink-0 font-bold tracking-wide text-primary uppercase">
        Expérimentation
      </span>
      <span className="flex-1">
        Ce chatbot est une expérimentation. Vos interactions sont analysées pour évaluer sa qualité
        et sont pseudonymisées.
      </span>
      <IconButton
        label="Masquer le bandeau"
        size="sm"
        className="shrink-0"
        onClick={() => {
          writeHidden()
          setHidden(true)
          analytics.trackEvent(analyticsEvents.assistant.bannerDismiss())
        }}
      >
        <X />
      </IconButton>
    </div>
  )
}
