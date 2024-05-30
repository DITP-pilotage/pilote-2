import { mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';
import { ListerTokenAPIInformationUseCase } from '@/server/authentification/usecases/ListerTokenAPIInformationUseCase';

describe('ListerTokenAPIInformationUseCase', () => {
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let listerTokenAPIInformationUseCase: ListerTokenAPIInformationUseCase;

  beforeEach(() => {
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    listerTokenAPIInformationUseCase = new ListerTokenAPIInformationUseCase({ tokenAPIInformationRepository });
  });

  it('doit récupérer la liste des tokens api', async () => {
    // Given
    const tokenAPIInformation1 = new TokenAPIInformationBuilder().build();
    const tokenAPIInformation2 = new TokenAPIInformationBuilder().build();
    tokenAPIInformationRepository.listerTokenAPIInformation.mockResolvedValue([tokenAPIInformation1, tokenAPIInformation2]);

    // When
    const result = await listerTokenAPIInformationUseCase.run();

    // Then
    expect(result).toHaveLength(2);
  });
});
