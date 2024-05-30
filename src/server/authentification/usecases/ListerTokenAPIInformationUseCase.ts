import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import {
  presenterEnTokenAPIInformationContrat,
  TokenAPIInformationContrat,
} from '@/server/authentification/app/contrats/TokenAPIInformationContrat';

export class ListerTokenAPIInformationUseCase {
  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({ tokenAPIInformationRepository }: { tokenAPIInformationRepository: TokenAPIInformationRepository }) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run(): Promise<TokenAPIInformationContrat[]> {
    const listeTokenAPIInformation = await this.tokenAPIInformationRepository.listerTokenAPIInformation();
    return listeTokenAPIInformation.map(presenterEnTokenAPIInformationContrat);
  }
}
