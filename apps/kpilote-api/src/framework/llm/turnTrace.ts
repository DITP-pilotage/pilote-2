import { type Model } from '@pilote/kpilote-shared/assistant/chat'

export type SubCallTrace = {
  name: string
  model: Model
  inputTokens: number
  outputTokens: number
  durationMs: number
}

/**
 * Les appels LLM secondaires d'un tour (classements, sous-agents). Collectés en mémoire :
 * l'appel principal n'est écrit qu'en fin de tour, ses sous-appels le sont avec lui.
 */
export class TurnTrace {
  readonly #entries: SubCallTrace[] = []

  record(entry: SubCallTrace): void {
    this.#entries.push(entry)
  }

  entries(): ReadonlyArray<SubCallTrace> {
    return this.#entries
  }
}
