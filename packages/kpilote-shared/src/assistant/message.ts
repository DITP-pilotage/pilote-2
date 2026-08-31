import type { UIMessage } from 'ai'

import type { Source } from './sources'
import type { KpiloteUITools } from './tools'

/** Parts de données émises par le moteur en plus du texte et des appels d'outils. */
export type KpiloteDataParts = { sources: Source[] }

export type KpiloteUIMessage = UIMessage<never, KpiloteDataParts, KpiloteUITools>
