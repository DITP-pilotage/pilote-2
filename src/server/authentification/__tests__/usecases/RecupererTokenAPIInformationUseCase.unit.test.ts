import { mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';
import { UtilisateurRepository } from '@/server/authentification/domain/ports/UtilisateurRepository';
import { RecupererTokenAPIInformationUseCase } from '@/server/authentification/usecases/RecupererTokenAPIInformationUseCase';

describe('recupererTokenAPIInformation', () => {
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let recupererTokenAPIInformationUseCase: RecupererTokenAPIInformationUseCase;

  beforeEach(() => {
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    recupererTokenAPIInformationUseCase = new RecupererTokenAPIInformationUseCase({ tokenAPIInformationRepository });

  });

  const email = 'test@example.com';

  it('doit récupérer le token associé à l\'email si ce dernier existe', async () => {
    // Given
    const tokenAPIInformation = new TokenAPIInformationBuilder().withEmail(email).build();
    utilisateurRepository.estPresent.mockResolvedValue(true);
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockResolvedValue(tokenAPIInformation);
  
    // Then
    await expect(recupererTokenAPIInformationUseCase.run({ email })).toHaveBeenCalled;
  });
  

  it('doit retourner null s\'il ne trouve pas d\'email correspondant', async () => {
    // Given
    const tokenAPIInformation = new TokenAPIInformationBuilder().withEmail(email).build();
    utilisateurRepository.estPresent.mockResolvedValue(false);
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockRejectedValue(tokenAPIInformation);
   
    // Then
    await expect(recupererTokenAPIInformationUseCase.run({ email })).toReject();
  });
});
