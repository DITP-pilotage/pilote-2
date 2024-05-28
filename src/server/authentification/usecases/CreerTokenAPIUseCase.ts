import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';

export class CreerTokenAPIUseCase {
  private readonly tokenAPIService: TokenAPIService;

  private readonly tokenAPIRepository: TokenAPIInformationRepository;

  constructor({ tokenAPIService, tokenAPIInformationRepository }: {
    tokenAPIService: TokenAPIService,
    tokenAPIInformationRepository: TokenAPIInformationRepository
  }) {
    this.tokenAPIService = tokenAPIService;
    this.tokenAPIRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email: string }): Promise<string> {
    const tokenAPIInformation = await this.tokenAPIRepository.recupererTokenAPIInformation({ email });

    if (tokenAPIInformation) {
      throw new Error('Un token existe déjà pour cet email');
    }

    const token = await this.tokenAPIService.creerTokenAPI({ email });
    await this.tokenAPIRepository.sauvegarderTokenAPIInformation({ email, dateCreation: new Date().toISOString() });
    return token;
  }
}
