import {
  DEFAULT_MEDIA_ALIGNMENT,
  DEFAULT_MEDIA_SIZE,
  type MediaAlignment,
  type MediaSize,
} from '@pilote/kpilote-shared/mediaLayout'
import { estUrlHttpSure, sansAutoplay } from '@pilote/kpilote-shared/url'

import { clsxm } from '../clsxm'
import { mediaClasses } from './mediaClasses'

// L'iframe ne déclare pas allow="autoplay" et `sansAutoplay` retire les paramètres
// d'autoplay de l'URL : la vidéo ne démarre jamais seule au chargement.
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
  // Défense en profondeur : on ne rend jamais l'iframe pour un schéma non http(s)
  // (ex. javascript:), même si l'appelant n'a pas validé la source.
  if (!estUrlHttpSure(src)) return null

  return (
    <div
      className={clsxm(
        'aspect-video w-full overflow-hidden rounded-md',
        mediaClasses({ alignment, size }),
        className,
      )}
    >
      <iframe
        src={sansAutoplay(src)}
        title={titre ?? 'Vidéo'}
        className="size-full"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  )
}
