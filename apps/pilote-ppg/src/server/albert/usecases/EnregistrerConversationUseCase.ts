import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

export class EnregistrerConversationUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(params: {
    id: string;
    utilisateurId: string;
    messages: PiloteUIMessage[];
    contexte: Record<string, unknown> | null;
  }): Promise<void> {
    if (params.messages.length === 0) return;

    await this.chatConversationRepository.save({
      id: params.id,
      utilisateurId: params.utilisateurId,
      titre: deriverTitre(params.messages),
      messages: params.messages,
      contexte: params.contexte,
    });
  }
}
