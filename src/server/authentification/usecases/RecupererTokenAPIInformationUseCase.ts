import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';

import { TokenAPIInformationContrat, presenterEnTokenAPIInformationContrat } from '@/server/authentification/app/contrats/TokenAPIInformationContrat';

export class RecupererTokenAPIInformationUseCase {
  private readonly tokenAPIInformationRepository: TokenAPIInformationRepository;

  constructor({ tokenAPIInformationRepository }: { tokenAPIInformationRepository: TokenAPIInformationRepository }) {
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
  }

  async run({ email }: { email:string }):Promise<TokenAPIInformationContrat | null> {
    const tokenApiInformation = await this.tokenAPIInformationRepository.recupererTokenAPIInformation({ email });
    return tokenApiInformation ? presenterEnTokenAPIInformationContrat(tokenApiInformation) : null ;
  }
}
