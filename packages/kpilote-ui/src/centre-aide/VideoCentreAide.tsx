import { clsxm } from '../clsxm'

// Retire toute demande d'autoplay de l'URL d'intégration : la vidéo ne doit pas
// démarrer seule au chargement (retour client). L'iframe ne déclare pas non plus
// allow="autoplay", donc le navigateur bloque l'autoplay dans tous les cas.
export const sansAutoplay = (src: string): string => {
  try {
    const url = new URL(src)
    for (const cle of ['autoplay', 'auto_play', 'autostart']) url.searchParams.delete(cle)
    return url.toString()
  } catch {
    return src
  }
}

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
