import {
  DEFAULT_MEDIA_ALIGNMENT,
  DEFAULT_MEDIA_SIZE,
  type MediaAlignment,
  type MediaSize,
} from '@pilote/kpilote-shared/mediaLayout'

import { clsxm } from '../clsxm'
import { mediaClasses } from './mediaClasses'

export function ImageCentreAide({
  src,
  alt = '',
  alignment = DEFAULT_MEDIA_ALIGNMENT,
  size = DEFAULT_MEDIA_SIZE,
  className,
}: {
  src: string
  alt?: string
  alignment?: MediaAlignment
  size?: MediaSize
  className?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={clsxm('rounded-md', mediaClasses({ alignment, size }), className)}
    />
  )
}
