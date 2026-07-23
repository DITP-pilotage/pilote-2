import { clsxm } from '../clsxm'

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
        src={src}
        title={titre ?? 'Vidéo'}
        className="size-full"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
