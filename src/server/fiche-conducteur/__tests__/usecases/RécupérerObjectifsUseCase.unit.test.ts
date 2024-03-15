import { mock, MockProxy } from 'jest-mock-extended';
import { ObjectifBuilder } from '@/server/fiche-conducteur/app/builders/ObjectifBuilder';
import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { RécupérerObjectifsUseCase } from '@/server/fiche-conducteur/usecases/RécupérerObjectifsUseCase';

describe('RécupérerObjectifsUseCase', () => {
  let récupérerObjectifsUseCase: RécupérerObjectifsUseCase;
  let objectifRepository: MockProxy<ObjectifRepository>;

  beforeEach(() => {
    objectifRepository = mock<ObjectifRepository>();
    récupérerObjectifsUseCase = new RécupérerObjectifsUseCase({ objectifRepository });
  });

  it('doit récupérer les objectifs associés à un chantier', async () => {
    // Given
    const chantierId = 'CH-087';
    const objectif1 = new ObjectifBuilder().withType('a_faire').withContenu('Objectif a faire').build();
    const objectif2 = new ObjectifBuilder().withType('deja_fait').withContenu('Objectif deja fait').build();
    const objectif3 = new ObjectifBuilder().withType('notre_ambition').withContenu('Objectif notre ambition').build();
    objectifRepository.listerObjectifParChantierId.mockResolvedValue([objectif1, objectif2, objectif3]);

    // When
    const objectifsResult = await récupérerObjectifsUseCase.run({ chantierId });
    // Then
    expect(objectifsResult.get('notre_ambition')).toEqual('Objectif notre ambition');
    expect(objectifsResult.get('deja_fait')).toEqual('Objectif deja fait');
    expect(objectifsResult.get('a_faire')).toEqual('Objectif a faire');
  });
});
