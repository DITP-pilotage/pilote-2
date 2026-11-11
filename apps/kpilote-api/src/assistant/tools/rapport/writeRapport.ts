import { type RapportOutput, type RapportType } from '@pilote/kpilote-shared/assistant/tools'

export type Collected =
  { notFound: string[] } | { needsClarification: string } | { donnees: unknown }

/**
 * Chaque état porte tout le texte rédigé : un état par morceau ferait transiter un volume
 * quadratique. On en émet au plus un par intervalle.
 */
export const EMIT_INTERVAL_MS = 150

export async function* writeRapport({
  type,
  collected,
  redact,
  now = new Date(),
  clock = Date.now,
}: {
  type: RapportType
  collected: Collected
  redact: (prompt: string) => AsyncIterable<string>
  now?: Date
  clock?: () => number
}): AsyncGenerator<RapportOutput> {
  const state = (markdown: string, done: boolean): RapportOutput => ({
    type,
    dateRedaction: now.toISOString(),
    markdown,
    done,
  })

  if ('notFound' in collected) {
    yield { ...state('', true), notFound: collected.notFound }
    return
  }
  if ('needsClarification' in collected) {
    yield { ...state('', true), needsClarification: collected.needsClarification }
    return
  }

  yield state('', false)
  let markdown = ''
  let lastEmit = clock()
  for await (const chunk of redact(JSON.stringify(collected.donnees))) {
    markdown += chunk
    if (clock() - lastEmit >= EMIT_INTERVAL_MS) {
      lastEmit = clock()
      yield state(markdown, false)
    }
  }
  yield state(markdown, true)
}

/**
 * Le modèle principal ne relit que le texte de l'encart, pas les données : il répond aux
 * questions de suivi à partir de ce que l'utilisateur a lu.
 */
export const rapportToModel = (output: RapportOutput): string => {
  if (output.notFound?.length) {
    return `Aucun encart rédigé : identifiants inexistants ou que l'utilisateur ne peut pas consulter (${output.notFound.join(', ')}).`
  }
  if (output.needsClarification) return output.needsClarification
  // Rédigé à partir de contenus saisis par les équipes : un texte à rapporter, pas à suivre.
  return output.done
    ? output.markdown
    : `Encart interrompu avant la fin de sa rédaction ; ce qui a été rédigé :\n\n${output.markdown}`
}
