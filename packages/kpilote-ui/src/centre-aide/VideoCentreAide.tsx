import {
  DEFAULT_MEDIA_ALIGNMENT,
  DEFAULT_MEDIA_SIZE,
  type MediaAlignment,
  type MediaSize,
} from '@pilote/kpilote-shared/mediaLayout'
import { isFichiersMediaUrl } from '@pilote/kpilote-shared/mediaUrl'
import { estUrlHttpSure, sansAutoplay } from '@pilote/kpilote-shared/url'
import { Play } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '../clsxm'
import { mediaClasses } from './mediaClasses'

export function VideoCentreAide({
  src,
  titre,
  alignment = DEFAULT_MEDIA_ALIGNMENT,
  size = DEFAULT_MEDIA_SIZE,
  className,
}: {
  src: string
  titre?: string
  alignment?: MediaAlignment
  size?: MediaSize
  className?: string
}) {
  const [isStarted, setIsStarted] = useState(false)

  // Défense en profondeur : on ne rend jamais l'iframe pour un schéma non http(s)
  // (ex. javascript:), même si l'appelant n'a pas validé la source.
  if (!estUrlHttpSure(src)) return null

  const layoutClasses = clsxm('w-full rounded-md', mediaClasses({ alignment, size }), className)

  if (isFichiersMediaUrl(src)) {
    return (
      <video
        src={src}
        title={titre ?? 'Vidéo'}
        className={layoutClasses}
        controls
        preload="metadata"
      >
        <track kind="captions" />
      </video>
    )
  }

  const frameClasses = clsxm('aspect-video overflow-hidden', layoutClasses)

  // L'iframe n'est montée qu'au clic : la plateforme distante décide seule de démarrer,
  // et toutes les vidéos d'un article partiraient ensemble.
  if (!isStarted) {
    return (
      <button
        type="button"
        onClick={() => setIsStarted(true)}
        className={clsxm(
          frameClasses,
          'group flex cursor-pointer flex-col items-center justify-center gap-3 border border-border bg-surface-muted',
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
          <Play aria-hidden className="size-5 translate-x-0.5" fill="currentColor" />
        </span>
        <span className="px-4 text-sm text-text-muted">{titre ?? 'Lire la vidéo'}</span>
      </button>
    )
  }

  return (
    <div className={frameClasses}>
      <iframe
        src={sansAutoplay(src)}
        title={titre ?? 'Vidéo'}
        className="size-full"
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  )
}
