import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";
import { extractMessageText } from "@/server/albert/piloteUIMessageUtils";
import { genererPdfDepuisMarkdown } from "@/server/albert/pdf/genererPdfDepuisMarkdown";

export type ExporterDerniereReponseResultat =
  | { statut: "ok"; buffer: Buffer; filename: string }
  | { statut: "conversation_introuvable" }
  | { statut: "message_introuvable" }
  | { statut: "message_invalide" };

const NB_TENTATIVES = 3;
const DELAI_ENTRE_TENTATIVES_MS = 200;

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class ExporterDerniereReponseUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(params: {
    conversationId: string;
    messageId: string;
    utilisateurId: string;
  }): Promise<ExporterDerniereReponseResultat> {
    const conversation = await this.recupererAvecRetries(
      params.conversationId,
      params.utilisateurId,
    );
    if (!conversation) return { statut: "conversation_introuvable" };

    const message = conversation.messages.find(
      (candidat) => candidat.id === params.messageId,
    );
    if (!message) return { statut: "message_introuvable" };
    if (message.role !== "assistant") return { statut: "message_invalide" };

    const texte = extractMessageText(message);
    if (texte.trim().length === 0) return { statut: "message_invalide" };

    const buffer = await genererPdfDepuisMarkdown(texte);
    return {
      statut: "ok",
      buffer,
      filename: `reponse-albert-${params.messageId.slice(0, 8)}.pdf`,
    };
  }

  private async recupererAvecRetries(
    id: string,
    utilisateurId: string,
  ): Promise<ChatConversation | null> {
    for (let tentative = 1; tentative <= NB_TENTATIVES; tentative += 1) {
      const conversation = await this.chatConversationRepository.recupererParId(
        { id, utilisateurId },
      );
      if (conversation) return conversation;
      if (tentative < NB_TENTATIVES) await attendre(DELAI_ENTRE_TENTATIVES_MS);
    }
    return null;
  }
}
