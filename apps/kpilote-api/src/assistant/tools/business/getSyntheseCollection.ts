import { type CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { type CollectionTauxProgressionApiModel } from '@pilote/kpilote-shared/collectionTauxProgression'
import {
  syntheseCollectionInputSchema,
  type SyntheseCollectionOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { readBranch, WITHOUT_TERRITOIRE } from '@/assistant/tools/business/readBranch'
import { type Fetcher } from '@/assistant/tools/fetcher'

const DESCRIPTION = `Dresse en un seul appel l'état d'une collection : son identité, les indicateurs qu'elle regroupe, et — si un territoire est fourni — son taux d'avancement.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande où en est une collection ou son avancement d'ensemble.

Nécessite un identifiant au format COL-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_collections.

\`individuId\` est facultatif mais déterminant : le taux d'avancement d'une collection est calculé POUR UN TERRITOIRE. Sans lui, cette section revient indisponible et tu dois demander lequel avant de rappeler l'outil.

Chaque section est soit \`{ data }\`, soit \`{ unavailable }\` avec la raison.`

export const createGetSyntheseCollectionTool = (fetcher: Fetcher): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: syntheseCollectionInputSchema,
    execute: async ({ id, individuId }): Promise<SyntheseCollectionOutput> => {
      const [identite, tauxProgression] = await Promise.all([
        readBranch<CollectionApiModel>(fetcher, `/collections/${id}`),
        individuId
          ? readBranch<CollectionTauxProgressionApiModel>(
              fetcher,
              `/collections/${id}/taux-progression?individu=${individuId}`,
            )
          : WITHOUT_TERRITOIRE,
      ])

      return { identite, tauxProgression }
    },
  })
