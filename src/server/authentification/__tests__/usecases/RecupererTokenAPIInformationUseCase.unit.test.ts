import { mock, MockProxy } from 'jest-mock-extended';
import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIInformationBuilder } from '@/server/authentification/app/builder/TokenAPIInformationBuilder';
import {
  RecupererTokenAPIInformationUseCase,
} from '@/server/authentification/usecases/RecupererTokenAPIInformationUseCase';

describe('#recupererTokenAPIInformation', () => {
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let recupererTokenAPIInformationUseCase: RecupererTokenAPIInformationUseCase;

  beforeEach(() => {
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    recupererTokenAPIInformationUseCase = new RecupererTokenAPIInformationUseCase({ tokenAPIInformationRepository });
  });

  it("s'il existe un token associé à l'email, retourne le token api", async () => {
    // Given
    const email = 'test@example.com';
    const tokenInformation = new TokenAPIInformationBuilder().withEmail(email).build();
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockResolvedValue(tokenInformation);

    // When
    const result = await recupererTokenAPIInformationUseCase.run({ email });

    // Then
    expect(tokenAPIInformationRepository.recupererTokenAPIInformation).toHaveBeenNthCalledWith(1, { email });
    expect(result?.email).toEqual('test@example.com');
  });

  it("s'il n'existe pas de token associé à l'email, retourne null", async () => {
    // Given
    const email = 'test@example.com';
    tokenAPIInformationRepository.recupererTokenAPIInformation.mockResolvedValue(null);

    // When
    const result = await recupererTokenAPIInformationUseCase.run({ email });
   
    // Then
    expect(tokenAPIInformationRepository.recupererTokenAPIInformation).toHaveBeenNthCalledWith(1, { email });
    expect(result).toEqual(null);
  });
});
