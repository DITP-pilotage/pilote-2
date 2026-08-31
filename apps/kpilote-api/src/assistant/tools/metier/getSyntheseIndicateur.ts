import {
  inputIdIndicateurSchema,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { composerAppels } from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état complet d'un indicateur : son identité, son taux de progression, ses valeurs remarquables, ses objectifs et la synthèse par individu.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison. Une section indisponible pour cause de droits n'est PAS une absence de donnée : ne l'annonce jamais comme telle.`

export const creerGetSyntheseIndicateurTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputIdIndicateurSchema,
    execute: ({ id }): Promise<SyntheseIndicateurOutput> =>
      composerAppels<SyntheseIndicateurOutput>(requeteur, {
        identite: `/indicateurs/${id}`,
        tauxProgression: `/indicateurs/${id}/taux-progression`,
        valeursRemarquables: `/indicateurs/${id}/valeurs-remarquables`,
        objectifs: `/indicateurs/${id}/objectifs`,
        syntheseIndividus: `/indicateurs/${id}/synthese-individus`,
      }),
  })
