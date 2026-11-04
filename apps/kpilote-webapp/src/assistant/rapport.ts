import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import type { RapportOutput, RapportType } from '@pilote/kpilote-shared/assistant/tools'

type MessagePart = KpiloteUIMessage['parts'][number]

export type RapportPart = Extract<
  MessagePart,
  { type: 'tool-write_synthese' | 'tool-write_comparaison' }
>

export const isRapportPart = (part: MessagePart): part is RapportPart =>
  part.type === 'tool-write_synthese' || part.type === 'tool-write_comparaison'

export const rapportTypeOf = (part: RapportPart): RapportType =>
  part.type === 'tool-write_synthese' ? 'synthese' : 'comparaison'

/** La sortie à afficher, ou `null` quand l'encart n'a pas été rédigé (erreur, introuvable). */
export const rapportOutput = (part: RapportPart): RapportOutput | null => {
  if (part.state !== 'output-available' || 'error' in part.output) return null
  const { output } = part
  return output.notFound?.length || output.needsClarification ? null : output
}

/** Les encarts rédigés d'un message, dans l'ordre. */
export const writtenRapports = (message: KpiloteUIMessage): RapportOutput[] =>
  message.parts.flatMap((part) => {
    const output = isRapportPart(part) ? rapportOutput(part) : null
    return output && output.markdown.length > 0 ? [output] : []
  })

const MAX_FILE_NAME = 80

const slug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, MAX_FILE_NAME)
    .replace(/-+$/u, '')

/** Le nom du document : le titre de l'encart, à défaut son type et sa date. */
export const rapportFileName = ({
  markdown,
  type,
  dateRedaction,
}: Pick<RapportOutput, 'markdown' | 'type' | 'dateRedaction'>): string => {
  const title = /^#\s+(.+)$/mu.exec(markdown)?.[1]
  const fromTitle = title ? slug(title) : ''
  return fromTitle || `${type}-${dateRedaction.slice(0, 10)}`
}
