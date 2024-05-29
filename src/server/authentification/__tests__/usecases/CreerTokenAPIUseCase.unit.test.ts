import { anyString, mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { CreerTokenAPIUseCase } from '@/server/authentification/usecases/CreerTokenAPIUseCase';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';

describe('CreerTokenAPIUseCase', () => {
  let tokenAPIService: MockProxy<TokenAPIService>;
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let creerTokenAPIUseCase: CreerTokenAPIUseCase;

  beforeEach(() => {
    tokenAPIService = mock<TokenAPIService>();
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    creerTokenAPIUseCase = new CreerTokenAPIUseCase({ tokenAPIService, tokenAPIInformationRepository });
  });

  it('doit creer un token api', async () => {
    // Given
    const email = 'test@example.com';
    tokenAPIService.creerTokenAPI.mockResolvedValue('tokenApi');
    // When
    const result = await creerTokenAPIUseCase.run({ email });
    // Then
    expect(tokenAPIService.creerTokenAPI).toHaveBeenNthCalledWith(1, { email });
    expect(tokenAPIInformationRepository.sauvegarderTokenAPIInformation).toHaveBeenNthCalledWith(1, { email, dateCreation: anyString() });
    expect(result).toEqual('tokenApi');
  });

  it('quand un token existe déjà, doit remonter une erreur', async () => {
    // Given
    const email = 'test@example.com';
    const tokenAPIInformation = new TokenAPIInformationBuilder().withEmail('test@example.com').build();
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockResolvedValue(tokenAPIInformation);
    // Then
    await expect(creerTokenAPIUseCase.run({ email })).toReject();
  });
});
