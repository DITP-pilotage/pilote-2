import type {
  AdminAlbertRepository,
  ConversationAdminDetail,
} from "@/server/albert/domain/AdminAlbertRepository";

export class RecupererConversationAdminUseCase {
  private readonly adminAlbertRepository: AdminAlbertRepository;

  constructor({
    adminAlbertRepository,
  }: {
    adminAlbertRepository: AdminAlbertRepository;
  }) {
    this.adminAlbertRepository = adminAlbertRepository;
  }

  async execute(params: {
    id: string;
  }): Promise<ConversationAdminDetail | null> {
    return this.adminAlbertRepository.recupererConversation(params);
  }
}
