import ChantierDonnéesTerritorialesRepository
  from '@/server/infrastructure/accès_données/chantierDonnéesTerritoriales/ChantierDonnéesTerritorialesRepository.interface';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import RécupérerChantierRépartitionGéographiqueUseCase from './RécupérerChantierRépartitionGéographiqueUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('RécupérerChantierRépartitionGéographiqueUseCase', () => {
  test('renvoie la donnée au bon format pour tous les territoires de toutes les mailles', async () => {
    //GIVEN
    const chantierId = 'CH-011';

    const stubChantierDonnéesTerritorialesRepository = { récupérerTousLesAvancementsDUnChantier: jest.fn().mockReturnValue({
      nationale: {
        FR: { avancement: { global: 0.9, annuel: null } },
      },
      régionale: {
        '01': { avancement: { global: 0.1, annuel: null } },
      },
      départementale: {
        '12': { avancement: { global: 0.2, annuel: null } },
        '13': { avancement: { global: 0.3, annuel: null } },
      },
    }) } as unknown as ChantierDonnéesTerritorialesRepository;

    const stubSynthèseDesRésultatsRepository = { récupérerLesPlusRécentesPourTousLesTerritoires: jest.fn().mockReturnValue({
      nationale: {
        FR: { météo: 'SOLEIL' },
      },
      régionale: {
        '01': { météo: 'NUAGE' },
      },
      départementale: {
        '12': { météo: 'NON_RENSEIGNEE' },
        '13': { météo: 'COUVERT' },
      },
    }) } as unknown as SynthèseDesRésultatsRepository;

    const récupérerChantierRépartitionGéographiqueUseCase = new RécupérerChantierRépartitionGéographiqueUseCase(
      stubChantierDonnéesTerritorialesRepository,
      stubSynthèseDesRésultatsRepository,
    );

    //WHEN
    const répartitionGéographique = await récupérerChantierRépartitionGéographiqueUseCase.run(chantierId);

    //THEN
    expect(répartitionGéographique).toStrictEqual({
      avancementsGlobauxTerritoriaux: {
        nationale: {
          FR: 0.9,
        },
        régionale: {
          '01': 0.1,
        },
        départementale: {
          '12': 0.2,
          '13': 0.3,
        },
      },
      météosTerritoriales: {
        nationale: {
          FR: 'SOLEIL',
        },
        régionale: {
          '01': 'NUAGE',
        },
        départementale: {
          '12': 'NON_RENSEIGNEE',
          '13': 'COUVERT',
        },
      },
    });
  });
});
