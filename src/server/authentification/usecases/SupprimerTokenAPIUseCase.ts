import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';

export class SupprimerTokenAPIUseCase {
  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({ tokenAPIInformationRepository }: { tokenAPIInformationRepository: TokenAPIInformationRepository }) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email: string }) {
    await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({ email });
  }
}
