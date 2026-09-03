import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type ObjectifIndicateurIndividuListApiModel } from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { type TauxProgressionListApiModel } from '@pilote/kpilote-shared/tauxProgression'
import {
  syntheseIndicateurInputSchema,
  type SyntheseBranch,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import {
  type SyntheseIndividusListApiModel,
  type ValeursRemarquablesListApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { tool, type Tool } from 'ai'

import { readBranch, WITHOUT_TERRITOIRE } from '@/assistant/tools/business/readBranch'
import { type Fetcher } from '@/assistant/tools/fetcher'

const DESCRIPTION = `Dresse en un seul appel l'état d'un indicateur : son identité, la répartition de ses valeurs entre territoires, et — si un territoire est fourni — son taux de progression, ses objectifs et sa variation récente.

Préfère TOUJOURS cet outil à l'enchaînement d'appels unitaires quand l'utilisateur demande « où en est » un indicateur, son avancement, son état ou une synthèse.

Nécessite un identifiant au format IND-XXX. Si l'utilisateur n'en fournit pas, résous-le d'abord avec search_indicateurs.

\`individuId\` est facultatif mais déterminant : les données de progression, d'objectifs et de variation sont lues POUR UN TERRITOIRE. Sans lui, ces sections reviennent indisponibles et tu dois demander à l'utilisateur quel territoire l'intéresse avant de rappeler l'outil.

Chaque section est soit \`{ data }\`, soit \`{ unavailable }\` avec la raison. Une section indisponible pour cause de droits n'est PAS une absence de donnée : ne l'annonce jamais comme telle.`

const SANS_REFERENTIEL: SyntheseBranch<never> = {
  unavailable: "Cet indicateur n'est configuré sur aucun référentiel.",
}

/** Les référentiels sur lesquels l'indicateur est configuré, lus dans son identité. */
const referentielsFromIdentity = (identite: SyntheseBranch<IndicateurApiModel>): string[] => {
  if (!('data' in identite)) return []
  return identite.data.referentiels.map((configuration) => configuration.id)
}

export const createGetSyntheseIndicateurTool = (fetcher: Fetcher): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: syntheseIndicateurInputSchema,
    execute: async ({ id, individuId }): Promise<SyntheseIndicateurOutput> => {
      // Deux temps : l'identité porte les référentiels de l'indicateur, dont les valeurs
      // remarquables ont besoin. Les composer à l'aveugle produirait un 400.
      const identite = await readBranch<IndicateurApiModel>(fetcher, `/indicateurs/${id}`)
      const referentiels = referentielsFromIdentity(identite)

      // Les branches restantes partent ensemble : elles ne dépendent que de l'identité
      // déjà lue. Celles qui exigent une donnée absente ne sont pas appelées du tout et
      // rapportent la marche à suivre, plutôt que de revenir avec un 400 opaque.
      const [valeursRemarquables, tauxProgression, objectifs, syntheseIndividus] =
        await Promise.all([
          referentiels.length > 0
            ? readBranch<ValeursRemarquablesListApiModel>(
                fetcher,
                `/indicateurs/${id}/valeurs-remarquables?referentiels=${referentiels.join(',')}`,
              )
            : SANS_REFERENTIEL,
          individuId
            ? readBranch<TauxProgressionListApiModel>(
                fetcher,
                `/indicateurs/${id}/taux-progression?individus=${individuId}`,
              )
            : WITHOUT_TERRITOIRE,
          individuId
            ? readBranch<ObjectifIndicateurIndividuListApiModel>(
                fetcher,
                `/indicateurs/${id}/objectifs?individus=${individuId}`,
              )
            : WITHOUT_TERRITOIRE,
          individuId
            ? readBranch<SyntheseIndividusListApiModel>(
                fetcher,
                `/indicateurs/${id}/synthese-individus?individus=${individuId}`,
              )
            : WITHOUT_TERRITOIRE,
        ])

      return { identite, valeursRemarquables, tauxProgression, objectifs, syntheseIndividus }
    },
  })
