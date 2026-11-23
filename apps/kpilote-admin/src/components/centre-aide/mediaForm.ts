import {
  buildFichiersMediaUrl,
  extractFichiersItemId,
  isAllowedMediaUrl,
  isFichiersMediaUrl,
  isFichiersUrl,
  MEDIA_EXTENSIONS,
  MEDIA_ORIGINS,
  type MediaKind,
} from '@pilote/kpilote-shared/mediaUrl'
import { z } from 'zod'

export type MediaFormValues = { url: string; fileName: string; extension: string }

export const buildMediaFormDefaults = (kind: MediaKind): MediaFormValues => ({
  url: '',
  fileName: '',
  extension: MEDIA_EXTENSIONS[kind][0],
})

// L'adresse copiée depuis l'explorateur ouvre la page du fichier, pas le média : il faut
// le nom et l'extension du fichier pour reconstruire l'adresse du média.
export const needsFileDetails = (url: string): boolean =>
  isFichiersUrl(url) && !isFichiersMediaUrl(url)

export const buildMediaFormSchema = (kind: MediaKind) =>
  z
    .object({ url: z.string().trim(), fileName: z.string().trim(), extension: z.string() })
    .superRefine(({ url, fileName }, context) => {
      if (!isAllowedMediaUrl({ kind, url })) {
        context.addIssue({
          code: 'custom',
          path: ['url'],
          message: `L’URL doit commencer par ${MEDIA_ORIGINS[kind].join(' ou ')}.`,
        })
        return
      }
      if (!needsFileDetails(url)) return
      if (extractFichiersItemId(url) === null) {
        context.addIssue({
          code: 'custom',
          path: ['url'],
          message:
            'Cette adresse ne contient pas l’identifiant du fichier. Ouvrez le fichier dans l’explorateur et copiez l’adresse affichée par le navigateur.',
        })
        return
      }
      if (fileName === '') {
        context.addIssue({
          code: 'custom',
          path: ['fileName'],
          message: 'Le nom du fichier est requis.',
        })
      }
    })

export const resolveMediaUrl = ({ url, fileName, extension }: MediaFormValues): string => {
  const itemId = needsFileDetails(url) ? extractFichiersItemId(url) : null
  return itemId === null ? url : buildFichiersMediaUrl({ itemId, fileName, extension })
}
