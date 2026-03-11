import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import { TokenAPIInformation } from "@/server/authentification/domain/TokenAPIInformation";
import type { Inject } from "@/server/legacy/module";

export class RecupererTokenAPIInformationUseCase {
  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({
    tokenAPIInformationRepository,
  }: Inject<"tokenAPIInformationRepository">) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email: string }): Promise<TokenAPIInformation | null> {
    return this.tokenAPIInformationRepository.recupererTokenAPIInformation({
      email,
    });
  }
}
