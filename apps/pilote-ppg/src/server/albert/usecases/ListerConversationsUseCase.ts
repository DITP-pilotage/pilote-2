import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversationResume } from "@/server/albert/domain/ChatConversation";

const LIMITE_PAR_DEFAUT = 50;

export class ListerConversationsUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(params: {
    utilisateurId: string;
  }): Promise<ChatConversationResume[]> {
    return this.chatConversationRepository.listerPourUtilisateur({
      utilisateurId: params.utilisateurId,
      limite: LIMITE_PAR_DEFAUT,
    });
  }
}
