import {
  inputRechercheSchema,
  type EntiteTrouvee,
  type SearchOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'
import { z } from 'zod'

import {
  creerModeleAssistant,
  MAX_CANDIDATS_CLASSEMENT,
  MAX_CATALOGUE_REPLI,
  TEMPERATURE_STRUCTUREE,
} from '@/assistant/runtime/modele'
import {
  classerParTermesSatisfaits,
  decouperEnTermes,
  filtrerHallucinations,
} from '@/assistant/tools/metier/prefiltrer'
import { logger } from '@/framework/logger/logger'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'

/** `pageSizeSchema` plafonne à 100 : ne jamais demander davantage. */
const PAGE_MAX = 100

const MAX_RESULTATS = 10

const classementSchema = z.object({
  resultats: z
    .array(z.object({ id: z.string() }))
    .max(MAX_RESULTATS)
    .describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

export type Classeur = (
  requete: string,
  candidats: ReadonlyArray<EntiteTrouvee>,
) => Promise<ReadonlyArray<{ id: string }>>

/**
 * Résout un libellé approximatif en identifiants, en trois temps.
 *
 * 1. Pré-filtre déterministe par le filtre `recherche` de l'API, terme par terme.
 * 2. Court-circuit : zéro ou un candidat n'appelle pas le modèle.
 * 3. Classement par sous-modèle sur les candidats restants, puis filtrage anti-invention.
 *
 * Le repli sur catalogue complet existe parce que le pré-filtre est un `LIKE` : il échoue
 * sur les acronymes, précisément là où ppg brillait. On le borne et on le journalise plutôt
 * que d'en faire le cas nominal.
 */
export const rechercherEntites = async ({
  requete,
  filtrerParTerme,
  chargerCatalogue,
  classer,
}: {
  requete: string
  filtrerParTerme: (terme: string) => Promise<EntiteTrouvee[]>
  chargerCatalogue: () => Promise<EntiteTrouvee[]>
  classer: Classeur
}): Promise<SearchOutput> => {
  const termes = decouperEnTermes(requete)

  const parFiltre =
    termes.length === 0 ? [] : (await Promise.all(termes.map(filtrerParTerme))).flat()
  let candidats = classerParTermesSatisfaits(parFiltre, termes)
  let repli = false

  if (candidats.length === 0) {
    const catalogue = await chargerCatalogue()

    if (catalogue.length > MAX_CATALOGUE_REPLI) {
      // Pas de troncature silencieuse : une liste coupée se lit comme « rien trouvé ».
      return {
        resultats: [],
        repli: false,
        raison: `Le catalogue accessible est trop large (${catalogue.length} entrées) pour une recherche exhaustive. Demande à l'utilisateur de préciser sa demande.`,
      }
    }

    if (catalogue.length === 0) {
      return { resultats: [], repli: false, raison: 'Aucune entité accessible.' }
    }

    repli = true
    candidats = catalogue
    logger.info(
      {
        event: 'assistant.recherche.repli',
        nbCandidatsPrefiltre: 0,
        tailleCatalogue: catalogue.length,
      },
      'Recherche — repli sur le catalogue complet',
    )
  }

  const premier = candidats[0]
  if (candidats.length === 1 && premier) return { resultats: [premier], repli }

  const classement = await classer(requete, candidats.slice(0, MAX_CANDIDATS_CLASSEMENT))
  const resultats = filtrerHallucinations(classement, candidats, (candidat) => candidat.id)

  return resultats.length === 0
    ? { resultats: [], repli, raison: 'Aucune entité ne correspond à la demande.' }
    : { resultats, repli }
}

const SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et une liste de candidats.
Ta tâche : renvoyer les identifiants des candidats qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum ${MAX_RESULTATS}.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent. N'en invente jamais.
Prends en compte les acronymes, les synonymes métier et les thématiques de politique publique.
Si aucun candidat ne correspond, renvoie une liste vide.`

export const creerClasseurLlm =
  (abortSignal?: AbortSignal): Classeur =>
  async (requete, candidats) => {
    const sortie = await generateText({
      model: creerModeleAssistant(),
      system: SYSTEM_PROMPT,
      prompt: `${requete}\n\n<candidats>\n${JSON.stringify(candidats)}\n</candidats>`,
      output: Output.object({ schema: classementSchema }),
      stopWhen: stepCountIs(3),
      temperature: TEMPERATURE_STRUCTUREE,
      // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
      ...(abortSignal ? { abortSignal } : {}),
    })
    return sortie.output.resultats
  }

const DESCRIPTION = `Identifie des indicateurs (IND-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur mentionne une thématique, un acronyme ou un libellé approximatif sans donner d'identifiant — « l'indicateur sur la fraude fiscale », « les délais de paiement ».

N'utilise PAS cet outil quand l'utilisateur a déjà fourni un IND-XXX explicite : appelle directement get_indicateur ou get_synthese_indicateur.

Renvoie au maximum ${MAX_RESULTATS} indicateurs, avec leur identifiant et leur nom uniquement. Aucune donnée de valeur ou d'avancement — utilise les autres outils pour cela. Quand \`resultats\` est vide, \`raison\` explique pourquoi : rapporte-la à l'utilisateur.`

const enEntitesTrouvees = (items: ReadonlyArray<{ id: string; nom: string }>): EntiteTrouvee[] =>
  items.map((item) => ({ publicId: item.id, nom: item.nom }))

export const creerSearchIndicateursTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: inputRechercheSchema,
    execute: async ({ requete }, { abortSignal }): Promise<SearchOutput> =>
      rechercherEntites({
        requete,
        // Les deux chargements passent par la query, donc par `withIndicateurReadPermission` :
        // le catalogue est déjà restreint à ce que le principal peut lire.
        filtrerParTerme: (terme) =>
          listIndicateurs({ recherche: terme, pageSize: PAGE_MAX }).match(
            (data) => enEntitesTrouvees(data.items),
            () => [],
          ),
        chargerCatalogue: () =>
          listIndicateurs({ pageSize: PAGE_MAX }).match(
            (data) => enEntitesTrouvees(data.items),
            () => [],
          ),
        classer: creerClasseurLlm(abortSignal),
      }),
  })
