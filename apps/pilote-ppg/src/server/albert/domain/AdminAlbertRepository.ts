import type { $Enums } from "@prisma/client";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ConversationAdminResume = {
  id: string;
  titre: string;
  extraitPremierMessageUser: string;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    profilCode: string;
    profilNom: string;
  };
  createdAt: Date;
  updatedAt: Date;
  aPouce: boolean;
  aPouceBas: boolean;
  aCommentaire: boolean;
};

export type ConversationAdminDetail = ConversationAdminResume & {
  messages: PiloteUIMessage[];
  contexte: Record<string, unknown> | null;
  llmCalls: Array<{
    id: string;
    evaluation: $Enums.llm_call_evaluation | null;
    commentaire: string | null;
    createdAt: Date;
  }>;
};

export type TriListeConversations = {
  champ: "createdAt" | "updatedAt";
  direction: "asc" | "desc";
};

export type FiltresListeConversations = {
  recherche?: string;
  avecPouce?: boolean;
  avecPouceBas?: boolean;
  avecCommentaire?: boolean;
  profilCodes?: string[];
};

export type ListerConversationsParams = FiltresListeConversations & {
  tri: TriListeConversations;
  page: number;
  taillePage: number;
};

export type ListerConversationsResult = {
  total: number;
  items: ConversationAdminResume[];
};

export interface AdminAlbertRepository {
  listerConversations(
    params: ListerConversationsParams,
  ): Promise<ListerConversationsResult>;

  recupererConversation(params: {
    id: string;
  }): Promise<ConversationAdminDetail | null>;
}
