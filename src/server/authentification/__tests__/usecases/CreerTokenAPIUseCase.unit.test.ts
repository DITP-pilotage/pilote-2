import { anyString, mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIService } from '@/server/authentification/domain/ports/TokenAPIService';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { CreerTokenAPIUseCase } from '@/server/authentification/usecases/CreerTokenAPIUseCase';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';
import { UtilisateurRepository } from '@/server/authentification/domain/ports/UtilisateurRepository';

describe('CreerTokenAPIUseCase', () => {
  let tokenAPIService: MockProxy<TokenAPIService>;
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let creerTokenAPIUseCase: CreerTokenAPIUseCase;

  beforeEach(() => {
    tokenAPIService = mock<TokenAPIService>();
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    creerTokenAPIUseCase = new CreerTokenAPIUseCase({ tokenAPIService, tokenAPIInformationRepository, utilisateurRepository });
  });

  it('doit creer un token api', async () => {
    // Given
    const email = 'test@example.com';
    tokenAPIService.creerTokenAPI.mockResolvedValue('tokenApi');
    utilisateurRepository.estPresent.mockResolvedValue(true);
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
    utilisateurRepository.estPresent.mockResolvedValue(true);
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockResolvedValue(tokenAPIInformation);
    // Then
    await expect(creerTokenAPIUseCase.run({ email })).toReject();
  });

  it('quand l\'email n\'appartient pas a un utilisateur connu', async () => {
    // Given
    const email = 'test@example.com';
    utilisateurRepository.estPresent.mockResolvedValue(false);
    // Then
    await expect(creerTokenAPIUseCase.run({ email })).toReject();
  });
});
