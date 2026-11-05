import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";

export const versContexteAffiche = (
  agentContext: AlbertAgentContext | undefined,
): ContexteAccueil | undefined =>
  agentContext && {
    territoireNom:
      récupérerDétailsSurUnTerritoire(agentContext.territoireCode)
        ?.nomAffiché ?? agentContext.territoireCode,
    jalon: agentContext.jalon,
    ...(agentContext.chantierId ? { chantierId: agentContext.chantierId } : {}),
  };

export const libelleContexte = (contexte: ContexteAccueil): string =>
  [contexte.chantierId, contexte.territoireNom, `Jalon ${contexte.jalon}`]
    .filter(Boolean)
    .join(" · ");

/**
 * Ce qui distingue deux contextes, seulement : « 26 - Drôme » plutôt que
 * « 26 - Drôme · Jalon 2026 » quand le jalon est le même des deux côtés.
 */
const partiesDistinctes = ({
  contexte,
  autre,
}: {
  contexte: ContexteAccueil;
  autre: ContexteAccueil | undefined;
}): string =>
  [
    contexte.chantierId !== autre?.chantierId ? contexte.chantierId : null,
    contexte.territoireNom !== autre?.territoireNom
      ? contexte.territoireNom
      : null,
    contexte.jalon !== autre?.jalon ? `jalon ${contexte.jalon}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const differenceDeContexte = ({
  conversation,
  page,
}: {
  conversation: ContexteAccueil | undefined;
  page: ContexteAccueil;
}): { conversation: string | null; page: string } => ({
  // Une conversation sans chantier, ouverte sur l'accueil du même
  // territoire : seule la page a quelque chose de distinct, on nomme alors le
  // territoire de la conversation.
  conversation: conversation
    ? partiesDistinctes({ contexte: conversation, autre: page }) ||
      conversation.territoireNom
    : null,
  page: partiesDistinctes({ contexte: page, autre: conversation }),
});
