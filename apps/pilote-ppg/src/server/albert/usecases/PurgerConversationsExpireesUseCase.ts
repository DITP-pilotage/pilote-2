import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

const RETENTION_JOURS = 14;
const MILLISECONDES_PAR_JOUR = 24 * 60 * 60 * 1000;

export class PurgerConversationsExpireesUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(
    params: { maintenant?: Date } = {},
  ): Promise<{ supprimees: number; anterieurA: Date }> {
    const maintenant = params.maintenant ?? new Date();
    const anterieurA = new Date(
      maintenant.getTime() - RETENTION_JOURS * MILLISECONDES_PAR_JOUR,
    );
    const supprimees = await this.chatConversationRepository.supprimerExpirees({
      anterieurA,
    });
    return { supprimees, anterieurA };
  }
}
