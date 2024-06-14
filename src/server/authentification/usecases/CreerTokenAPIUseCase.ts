import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { UtilisateurRepository } from '@/server/authentification/domain/ports/UtilisateurRepository';

export class CreerTokenAPIUseCase {
  private readonly tokenAPIService: TokenAPIService;

  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({ tokenAPIService, tokenAPIInformationRepository, utilisateurRepository }: {
    tokenAPIService: TokenAPIService,
    tokenAPIInformationRepository: TokenAPIInformationRepository
    utilisateurRepository: UtilisateurRepository
  }) {
    this.tokenAPIService = tokenAPIService;
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
    this.utilisateurRepository = utilisateurRepository;
  }

  async run({ email }: { email: string }): Promise<string> {
    const estUtilisateurPresent = await this.utilisateurRepository.estPresent({ email });

    if (!estUtilisateurPresent) {
      throw new Error(`L'email "${email}" n'existe pas dans la base d'utilisateur PILOTE`);
    }

    const tokenAPIInformation = await this.tokenAPIInformationRepository.recupererTokenAPIInformation({ email });

    if (tokenAPIInformation) {
      await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({ email });
    }

    const token = await this.tokenAPIService.creerTokenAPI({ email });
    await this.tokenAPIInformationRepository.sauvegarderTokenAPIInformation({ email, dateCreation: new Date().toISOString() });
    return token;
  }
}
