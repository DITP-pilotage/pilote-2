import { territoires } from "@/client/constants/territoires.json";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";

/**
 * Le contexte que la page chantier transmet à l'Assistant IA. Comme pour
 * l'accueil, il vit hors du composant pour que les evals puissent l'importer.
 */
export function construireAgentContextChantier({
  chantierId,
  chantierNom,
  territoireCode,
  jalon,
}: {
  chantierId: string;
  chantierNom: string;
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
    chantierId,
    instructions: `L'utilisateur consulte le chantier ${chantierId} « ${chantierNom} » sur le territoire ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce chantier et ce territoire par défaut lorsque l'utilisateur ne les précise pas dans sa question.`,
  };
}
