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
