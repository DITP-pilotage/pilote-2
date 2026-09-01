import {
  inputSyntheseCollectionSchema,
  type BrancheSynthese,
  type SyntheseCollectionOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { lireBranche, SANS_TERRITOIRE } from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état d'une collection : son identité, les indicateurs qu'elle regroupe, et — si un territoire est fourni — son taux d'avancement.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande où en est une collection ou son avancement d'ensemble.

Nécessite un identifiant au format COL-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_collections.

\`individuId\` est facultatif mais déterminant : le taux d'avancement d'une collection est calculé POUR UN TERRITOIRE. Sans lui, cette section revient indisponible et tu dois demander lequel avant de rappeler l'outil.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison.`

export const creerGetSyntheseCollectionTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputSyntheseCollectionSchema,
    execute: async ({ id, individuId }): Promise<SyntheseCollectionOutput> => {
      const sansTerritoire: BrancheSynthese<never> = SANS_TERRITOIRE
      const [identite, tauxProgression] = await Promise.all([
        lireBranche(requeteur, `/collections/${id}`),
        individuId
          ? lireBranche(requeteur, `/collections/${id}/taux-progression?individu=${individuId}`)
          : Promise.resolve(sansTerritoire),
      ])

      return { identite, tauxProgression } as SyntheseCollectionOutput
    },
  })
