import { clsxm } from '../clsxm'

export function ImageCentreAide({
  src,
  alt = '',
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  return <img src={src} alt={alt} className={clsxm('max-w-full rounded-md', className)} />
}
