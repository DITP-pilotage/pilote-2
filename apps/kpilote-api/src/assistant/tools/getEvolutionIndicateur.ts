import { type EvolutionIndicateurOutput } from '@pilote/kpilote-shared/assistant/tools'

import { findIndividu } from '@/assistant/tools/entityLookups'
import { findReadableIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

export const MAX_POINTS = 60

export const getEvolutionIndicateur: ToolDefinition<'get_evolution_indicateur'> = {
  description: `Renvoie la série des valeurs d'un indicateur pour un individu, en ordre chronologique, limitée aux ${MAX_POINTS} points les plus récents.
- \`truncated\` / \`total\` : la série était plus longue ; dis que seuls les derniers points sont lus.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
Utilise-le pour : une tendance, une évolution dans le temps, une comparaison entre deux dates.
Ne l'utilise pas pour : l'état actuel (dernière valeur, objectif, taux) → get_synthese_indicateur.`,
  execute: async ({ indicateurId, individuId }) => {
    const [indicateur, individu] = await Promise.all([
      findReadableIndicateur(indicateurId),
      findIndividu(individuId),
    ])
    const output: EvolutionIndicateurOutput = {
      indicateur: indicateur
        ? { id: indicateur.id, nom: indicateur.nom, unite: indicateur.unite?.libelle ?? null }
        : null,
      individu,
      points: [],
      total: 0,
      truncated: false,
      notFound: [...(indicateur ? [] : [indicateurId]), ...(individu ? [] : [individuId])],
    }
    if (!indicateur || !individu) return output

    const valeurs = await listValeursForIndicateur(indicateurId, {
      individus: [individuId],
    }).unwrapOr({ items: [] })
    const serie = valeurs.items
      .filter((item) => item.individu === individuId)
      .map((item) => ({ date: item.date, valeur: item.valeur }))
      .sort((left, right) => left.date.localeCompare(right.date))
    return {
      ...output,
      points: serie.slice(-MAX_POINTS),
      total: serie.length,
      truncated: serie.length > MAX_POINTS,
    }
  },
}
