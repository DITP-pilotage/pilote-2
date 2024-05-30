import { mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { SupprimerTokenAPIUseCase } from '@/server/authentification/usecases/SupprimerTokenAPIUseCase';

describe('SupprimerTokenAPIUseCase', () => {
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let supprimerTokenAPIUseCase: SupprimerTokenAPIUseCase;

  beforeEach(() => {
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    supprimerTokenAPIUseCase = new SupprimerTokenAPIUseCase({ tokenAPIInformationRepository });
  });

  it('doit supprimer un token api', async () => {
    // Given
    const email = 'test@example.com';
    // When
    await supprimerTokenAPIUseCase.run({ email });
    // Then
    expect(tokenAPIInformationRepository.supprimerTokenAPIInformation).toHaveBeenNthCalledWith(1, { email });
  });
});
