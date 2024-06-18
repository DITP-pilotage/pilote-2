import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';

export class RecupererTokenAPIInformationUseCase {
  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({ tokenAPIInformationRepository }: { tokenAPIInformationRepository: TokenAPIInformationRepository }) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email:string }): Promise<TokenAPIInformation | null> {
    return this.tokenAPIInformationRepository.recupererTokenAPIInformation({ email });
  }
}
