import { type SyntheseCollectionOutput } from '@pilote/kpilote-shared/assistant/tools'

import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import {
  findIndicateurNamesByIds,
  findIndividu,
  findReadableCollection,
} from '@/assistant/tools/entityLookups'
import { type QueryToolDefinition } from '@/assistant/tools/toolDefinition'

export const getSyntheseCollection: QueryToolDefinition<'get_synthese_collection'> = {
  description: `Renvoie l'état d'une collection pour un individu : son taux de progression pondéré et, pour chaque indicateur de la collection, sa pondération et son taux de progression.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
- \`tauxProgression\` à null : \`raisonSansTaux\` dit pourquoi. INDICATEUR_A_LA_BAISSE : la collection contient un indicateur pondéré à la baisse, dont le taux ne se calcule pas ; ce n'est pas un manque de données, dis-le ainsi. INDICATEUR_NON_CALCULABLE : un indicateur pondéré n'a pas d'objectif ou pas de valeur. COLLECTION_VIDE ou AUCUN_INDICATEUR_PONDERE : rien à moyenner.
- \`contributions[].sensSouhaite\` : BAISSE quand une valeur plus basse est meilleure ; le taux de ces indicateurs est toujours null.
Utilise-le pour : « où en est » une collection, ce qui tire son avancement vers le haut ou vers le bas.
Ne l'utilise pas pour : le détail d'un indicateur de la collection → get_synthese_indicateur.`,
  execute: async ({ collectionId, individuId }) => {
    const [collection, individu] = await Promise.all([
      findReadableCollection(collectionId),
      findIndividu(individuId),
    ])
    const notFound = [...(collection ? [] : [collectionId]), ...(individu ? [] : [individuId])]
    const empty: SyntheseCollectionOutput = {
      collection: collection
        ? { id: collection.id, nom: collection.nom, description: collection.description }
        : null,
      individu,
      tauxProgression: null,
      raisonSansTaux: null,
      contributions: [],
      notFound,
    }
    if (!collection || !individu) return empty

    const taux = await getCollectionTauxProgression({
      collectionPublicId: collectionId,
      query: { individu: individuId },
    }).unwrapOr(null)
    if (!taux) return empty

    // Une collection lisible peut contenir un indicateur qui ne l'est pas : sa contribution
    // n'est pas détaillée, il est seulement signalé.
    const noms = await findIndicateurNamesByIds(
      taux.contributions.map((contribution) => contribution.indicateur),
    )
    const lisibles = taux.contributions.filter((contribution) => noms.has(contribution.indicateur))
    return {
      ...empty,
      tauxProgression: taux.tauxProgression,
      raisonSansTaux: taux.raisonSansTaux,
      contributions: lisibles.map((contribution) => ({
        indicateur: { id: contribution.indicateur, nom: noms.get(contribution.indicateur) ?? '' },
        ponderation: contribution.ponderation,
        sensSouhaite: contribution.sensSouhaite,
        tauxProgression: contribution.tauxProgression,
      })),
      notFound: taux.contributions
        .filter((contribution) => !noms.has(contribution.indicateur))
        .map((contribution) => contribution.indicateur),
    }
  },
}
