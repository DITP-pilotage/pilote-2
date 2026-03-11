import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import type { Inject } from "@/server/legacy/module";

export class SupprimerTokenAPIUseCase {
  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({
    tokenAPIInformationRepository,
  }: Inject<"tokenAPIInformationRepository">) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email: string }) {
    await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({
      email,
    });
  }
}
