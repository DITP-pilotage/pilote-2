import { mock, MockProxy } from 'jest-mock-extended';
import {
  RécupérerTerritoireParCodeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { TerritoireBuilder } from '@/server/fiche-territoriale/app/builders/TerritoireBuilder';

describe('RécupérerTerritoireParCodeUseCase', () => {
  let récupérerTerritoireParCodeUseCase: RécupérerTerritoireParCodeUseCase;
  let territoireRepository: MockProxy<TerritoireRepository>;

  beforeEach(() => {
    territoireRepository = mock<TerritoireRepository>();
    récupérerTerritoireParCodeUseCase = new RécupérerTerritoireParCodeUseCase({ territoireRepository });
  });

  test('doit récupérer le territoire associé au code donné', async () => {
    // Given
    const territoireCode = 'UN-CODE';
    const territoireDemandé = new TerritoireBuilder()
      .withNomAffiché('Un nom de territoire')
      .build();
    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoireDemandé);

    // When
    const result = await récupérerTerritoireParCodeUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode: 'UN-CODE' });
    expect(result.nomAffiché).toStrictEqual('Un nom de territoire');
  });
});
