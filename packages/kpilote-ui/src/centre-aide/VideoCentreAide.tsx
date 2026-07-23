import { sansAutoplay } from '@pilote/kpilote-shared/url'

import { clsxm } from '../clsxm'

// L'iframe ne déclare pas allow="autoplay" et `sansAutoplay` retire les paramètres
// d'autoplay de l'URL : la vidéo ne démarre jamais seule au chargement.
export function VideoCentreAide({
  src,
  titre,
  className,
}: {
  src: string
  titre?: string
  className?: string
}) {
  return (
    <div className={clsxm('aspect-video w-full overflow-hidden rounded-md', className)}>
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
