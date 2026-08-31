import {
  inputRechercheSchema,
  type EntiteTrouvee,
  type SearchOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import { creerClasseurLlm, rechercherEntites } from '@/assistant/tools/metier/searchIndicateurs'
import { listCollections } from '@/collection/queries/listCollections'

/** `pageSizeSchema` plafonne à 100 : ne jamais demander davantage. */
const PAGE_MAX = 100

const DESCRIPTION = `Identifie des collections (COL-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur évoque un regroupement d'indicateurs par son thème ou son intitulé approximatif, sans donner d'identifiant.

N'utilise PAS cet outil quand un COL-XXX explicite est fourni : appelle directement get_collection ou get_synthese_collection.

Renvoie au maximum 10 collections, avec leur identifiant et leur nom uniquement. Quand \`resultats\` est vide, \`raison\` explique pourquoi : rapporte-la à l'utilisateur.`

const enEntitesTrouvees = (items: ReadonlyArray<{ id: string; nom: string }>): EntiteTrouvee[] =>
  items.map((item) => ({ publicId: item.id, nom: item.nom }))

export const creerSearchCollectionsTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputRechercheSchema,
    execute: async ({ requete }, { abortSignal }): Promise<SearchOutput> =>
      rechercherEntites({
        requete,
        filtrerParTerme: (terme) =>
          listCollections({ recherche: terme, pageSize: PAGE_MAX }).match(
            (data) => enEntitesTrouvees(data.items),
            () => [],
          ),
        chargerCatalogue: () =>
          listCollections({ pageSize: PAGE_MAX }).match(
            (data) => enEntitesTrouvees(data.items),
            () => [],
          ),
        classer: creerClasseurLlm(abortSignal),
      }),
  })
