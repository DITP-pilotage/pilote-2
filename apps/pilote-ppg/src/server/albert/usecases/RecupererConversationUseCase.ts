import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";

export class RecupererConversationUseCase {
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
  }): Promise<ChatConversation | null> {
    return this.chatConversationRepository.recupererParId(params);
  }
}
