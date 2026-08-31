import {
  inputIdCollectionSchema,
  type SyntheseCollectionOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état d'une collection : son identité, les indicateurs qu'elle regroupe et son taux de progression.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande où en est une collection ou son avancement d'ensemble.

Nécessite un identifiant au format COL-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_collections.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison.`

export const creerGetSyntheseCollectionTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputIdCollectionSchema,
    execute: ({ id }): Promise<SyntheseCollectionOutput> =>
      composerAppels<SyntheseCollectionOutput>(requeteur, {
        identite: `/collections/${id}`,
        tauxProgression: `/collections/${id}/taux-progression`,
      }),
  })
