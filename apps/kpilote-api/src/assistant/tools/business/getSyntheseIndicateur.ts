import {
  syntheseIndicateurInputSchema,
  type SyntheseBranch,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import {
  composeCalls,
  readBranch,
  WITHOUT_TERRITOIRE,
} from '@/assistant/tools/business/composeCalls'
import { type Fetcher } from '@/assistant/tools/fetcher'

const DESCRIPTION = `Dresse en un seul appel l'état d'un indicateur : son identité, la répartition de ses valeurs entre territoires, et — si un territoire est fourni — son taux de progression, ses objectifs et sa variation récente.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.

\`individuId\` est facultatif mais déterminant : les données de progression, d'objectifs et de variation sont lues POUR UN TERRITOIRE. Sans lui, ces sections reviennent indisponibles et tu dois demander à l'utilisateur quel territoire l'intéresse avant de rappeler l'outil.

Chaque section est soit \`{ data }\`, soit \`{ unavailable }\` avec la raison. Une section indisponible pour cause de droits n'est PAS une absence de donnée : ne l'annonce jamais comme telle.`

/** Les référentiels sur lesquels l'indicateur est configuré, lus dans son identité. */
const referentielsFromIdentity = (identite: SyntheseBranch<unknown>): string[] => {
  if (!('data' in identite)) return []
  const data = identite.data as { referentiels?: ReadonlyArray<{ id?: unknown }> }
  return (data.referentiels ?? [])
    .map((configuration) => configuration.id)
    .filter((id): id is string => typeof id === 'string')
}

export const createGetSyntheseIndicateurTool = (fetcher: Fetcher): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: syntheseIndicateurInputSchema,
    execute: async ({ id, individuId }): Promise<SyntheseIndicateurOutput> => {
      // Deux temps : l'identité porte les référentiels de l'indicateur, dont les valeurs
      // remarquables ont besoin. Les composer à l'aveugle produirait un 400.
      const identite = await readBranch(fetcher, `/indicateurs/${id}`)
      const referentiels = referentielsFromIdentity(identite)

      const calls: Record<string, string> = {}
      if (referentiels.length > 0) {
        calls.valeursRemarquables = `/indicateurs/${id}/valeurs-remarquables?referentiels=${referentiels.join(',')}`
      }
      if (individuId) {
        calls.tauxProgression = `/indicateurs/${id}/taux-progression?individus=${individuId}`
        calls.objectifs = `/indicateurs/${id}/objectifs?individus=${individuId}`
        calls.syntheseIndividus = `/indicateurs/${id}/synthese-individus?individus=${individuId}`
      }

      const branches = await composeCalls<Record<string, SyntheseBranch<unknown>>>(fetcher, calls)

      const withoutTerritoire: SyntheseBranch<never> = WITHOUT_TERRITOIRE

      return {
        identite,
        valeursRemarquables: branches.valeursRemarquables ?? {
          unavailable: "Cet indicateur n'est configuré sur aucun référentiel.",
        },
        tauxProgression: branches.tauxProgression ?? withoutTerritoire,
        objectifs: branches.objectifs ?? withoutTerritoire,
        syntheseIndividus: branches.syntheseIndividus ?? withoutTerritoire,
      } as SyntheseIndicateurOutput
    },
  })
