import { mock, MockProxy } from 'jest-mock-extended';
import { ObjectifBuilder } from '@/server/fiche-conducteur/app/builders/ObjectifBuilder';
import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { RécupérerPublicationsUseCase } from '@/server/fiche-conducteur/usecases/RécupérerPublicationsUseCase';
import { DecisionStrategiqueRepository } from '@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository';
import { DecisionStrategiqueBuilder } from '@/server/fiche-conducteur/app/builders/DecisionStrategiqueBuilder';

describe('RécupérerPublicationsUseCase', () => {
  let récupérerObjectifsUseCase: RécupérerPublicationsUseCase;
  let objectifRepository: MockProxy<ObjectifRepository>;
  let decisionStrategiqueRepository: MockProxy<DecisionStrategiqueRepository>;

  beforeEach(() => {
    objectifRepository = mock<ObjectifRepository>();
    decisionStrategiqueRepository = mock<DecisionStrategiqueRepository>();
    récupérerObjectifsUseCase = new RécupérerPublicationsUseCase({ objectifRepository, decisionStrategiqueRepository });
  });

  it('doit récupérer les dernières publications associées à un chantier', async () => {
    // Given
    const chantierId = 'CH-087';
    const objectif1 = new ObjectifBuilder().withType('a_faire').withContenu('Objectif a faire').withDate('2023-05-01T00:00:00.000Z').build();
    const objectif1Old = new ObjectifBuilder().withType('a_faire').withContenu('Objectif a faire old').withDate('2022-05-01T00:00:00.000Z').build();
    const objectif2 = new ObjectifBuilder().withType('deja_fait').withContenu('Objectif deja fait').withDate('2023-05-01T00:00:00.000Z').build();
    const objectif3 = new ObjectifBuilder().withType('notre_ambition').withContenu('Objectif notre ambition').withDate('2023-05-01T00:00:00.000Z').build();
    const decisionStrategique1Old = new DecisionStrategiqueBuilder().withType('suivi_des_decisions').withContenu('Suivi des décisions Old').withDate('2022-05-01T00:00:00.000Z').build();
    const decisionStrategique1 = new DecisionStrategiqueBuilder().withType('suivi_des_decisions').withContenu('Suivi des décisions').withDate('2023-05-01T00:00:00.000Z').build();
    objectifRepository.listerObjectifParChantierId.mockResolvedValue([objectif1Old, objectif1, objectif2, objectif3]);
    decisionStrategiqueRepository.listerDecisionStrategiqueParChantierId.mockResolvedValue([decisionStrategique1, decisionStrategique1Old]);

    // When
    const mapPublicationsResult = await récupérerObjectifsUseCase.run({ chantierId });
    // Then
    expect(mapPublicationsResult.get('notre_ambition')).toEqual('Objectif notre ambition');
    expect(mapPublicationsResult.get('deja_fait')).toEqual('Objectif deja fait');
    expect(mapPublicationsResult.get('a_faire')).toEqual('Objectif a faire');
    expect(mapPublicationsResult.get('suivi_des_decisions')).toEqual('Suivi des décisions');
  });
});
