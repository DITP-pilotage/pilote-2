import type {
  AdminAlbertRepository,
  ListerConversationsParams,
  ListerConversationsResult,
} from "@/server/albert/domain/AdminAlbertRepository";

export class ListerConversationsAdminUseCase {
  private readonly adminAlbertRepository: AdminAlbertRepository;

  constructor({
    adminAlbertRepository,
  }: {
    adminAlbertRepository: AdminAlbertRepository;
  }) {
    this.adminAlbertRepository = adminAlbertRepository;
  }

  async execute(
    params: ListerConversationsParams,
  ): Promise<ListerConversationsResult> {
    return this.adminAlbertRepository.listerConversations(params);
  }
}
