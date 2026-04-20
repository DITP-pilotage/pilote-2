import { TokenAPIInformationRepository } from "@/server/authentification/domain/ports/TokenAPIInformationRepository";
import {
  presenterEnTokenAPIInformationContrat,
  TokenAPIInformationContrat,
} from "@/server/authentification/app/contrats/TokenAPIInformationContrat";
import type { Inject } from "@/server/legacy/module";

export class ListerTokenAPIInformationUseCase {
  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({
    tokenAPIInformationRepository,
  }: Inject<"tokenAPIInformationRepository">) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run(): Promise<TokenAPIInformationContrat[]> {
    const listeTokenAPIInformation =
      await this.tokenAPIInformationRepository.listerTokenAPIInformation();
    return listeTokenAPIInformation.map(presenterEnTokenAPIInformationContrat);
  }
}
