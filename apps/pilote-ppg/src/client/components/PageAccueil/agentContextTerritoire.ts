import { territoires } from "@/client/constants/territoires.json";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";

/**
 * Le contexte que l'écran d'accueil transmet à l'Assistant IA. Les evals de
 * niveau 3 l'importent : un écart de formulation entre l'interface et les
 * evals rendrait les scores sans rapport avec ce que vit l'utilisateur.
 *
 * Lit le JSON des territoires directement plutôt que
 * `récupérerDétailsSurUnTerritoire` : `constants/territoires.ts` importe un
 * composant React, que les evals n'ont pas à charger.
 */
export function construireAgentContextTerritoire({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}): AlbertAgentContext {
  const territoire = territoires.find(
    (candidat) => candidat.code === territoireCode,
  );

  if (!territoire) {
    throw new Error(`Territoire inconnu : ${territoireCode}`);
  }

  return {
    jalon,
    territoireCode,
    instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
  };
}
