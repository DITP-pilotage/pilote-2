import type {
  ChatConversation,
  ChatConversationResume,
} from "./ChatConversation";

export interface ChatConversationRepository {
  save(params: {
    id: string;
    utilisateurId: string;
    titre: string;
    messages: unknown;
    contexte: Record<string, unknown> | null;
  }): Promise<void>;

  recupererParId(params: {
    id: string;
    utilisateurId: string;
  }): Promise<ChatConversation | null>;

  listerPourUtilisateur(params: {
    utilisateurId: string;
    limite: number;
  }): Promise<ChatConversationResume[]>;

  supprimer(params: { id: string; utilisateurId: string }): Promise<void>;

  supprimerExpirees(params: { anterieurA: Date }): Promise<number>;
}
