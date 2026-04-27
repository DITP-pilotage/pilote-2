import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

export class SupprimerConversationUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(params: { id: string; utilisateurId: string }): Promise<void> {
    await this.chatConversationRepository.supprimer(params);
  }
}
