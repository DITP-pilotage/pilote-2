import {
  inputSyntheseIndicateurSchema,
  type BrancheSynthese,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import {
  composerAppels,
  lireBranche,
  SANS_TERRITOIRE,
} from '@/assistant/tools/metier/composerAppels'
import { type Requeteur } from '@/assistant/tools/requeteur'

const DESCRIPTION = `Dresse en un seul appel l'état d'un indicateur : son identité, la répartition de ses valeurs entre territoires, et — si un territoire est fourni — son taux de progression, ses objectifs et sa variation récente.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.

\`individuId\` est facultatif mais déterminant : les données de progression, d'objectifs et de variation sont lues POUR UN TERRITOIRE. Sans lui, ces sections reviennent indisponibles et tu dois demander à l'utilisateur quel territoire l'intéresse avant de rappeler l'outil.

Chaque section est soit \`{ donnees }\`, soit \`{ indisponible }\` avec la raison. Une section indisponible pour cause de droits n'est PAS une absence de donnée : ne l'annonce jamais comme telle.`

/** Les référentiels sur lesquels l'indicateur est configuré, lus dans son identité. */
const referentielsDeLIdentite = (identite: BrancheSynthese<unknown>): string[] => {
  if (!('donnees' in identite)) return []
  const donnees = identite.donnees as { referentiels?: ReadonlyArray<{ id?: unknown }> }
  return (donnees.referentiels ?? [])
    .map((configuration) => configuration.id)
    .filter((id): id is string => typeof id === 'string')
}

export const creerGetSyntheseIndicateurTool = (requeteur: Requeteur): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputSyntheseIndicateurSchema,
    execute: async ({ id, individuId }): Promise<SyntheseIndicateurOutput> => {
      // Deux temps : l'identité porte les référentiels de l'indicateur, dont les valeurs
      // remarquables ont besoin. Les composer à l'aveugle produirait un 400.
      const identite = await lireBranche(requeteur, `/indicateurs/${id}`)
      const referentiels = referentielsDeLIdentite(identite)

      const appels: Record<string, string> = {}
      if (referentiels.length > 0) {
        appels.valeursRemarquables = `/indicateurs/${id}/valeurs-remarquables?referentiels=${referentiels.join(',')}`
      }
      if (individuId) {
        appels.tauxProgression = `/indicateurs/${id}/taux-progression?individus=${individuId}`
        appels.objectifs = `/indicateurs/${id}/objectifs?individus=${individuId}`
        appels.syntheseIndividus = `/indicateurs/${id}/synthese-individus?individus=${individuId}`
      }

      const branches = await composerAppels<Record<string, BrancheSynthese<unknown>>>(
        requeteur,
        appels,
      )

      const sansTerritoire: BrancheSynthese<never> = SANS_TERRITOIRE

      return {
        identite,
        valeursRemarquables: branches.valeursRemarquables ?? {
          indisponible: "Cet indicateur n'est configuré sur aucun référentiel.",
        },
        tauxProgression: branches.tauxProgression ?? sansTerritoire,
        objectifs: branches.objectifs ?? sansTerritoire,
        syntheseIndividus: branches.syntheseIndividus ?? sansTerritoire,
      } as SyntheseIndicateurOutput
    },
  })
