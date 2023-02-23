import { createMocks } from 'node-mocks-http';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import handle from '../../../../pages/api/evolution_indicateur';

describe('/api/evolution_indicateur', () => {
  it('renvoyer une liste vide d\'évolution d\'indicateur', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantier_id: 'CH-001', indicateur_id: 'IND-001', maille: 'DEPT', codes_insee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getEvolutionIndicateur = () => Promise.resolve([]);

    // When
    handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
  });

  it('renvoyer une liste d\'évolution d\'indicateur', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantier_id: 'CH-001', indicateur_id: 'IND-001', maille: 'DEPT', codes_insee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getEvolutionIndicateur = () => Promise.resolve([
      {
        maille: 'départementale',
        codeInsee: '75',
        valeurCible: 123,
        évolutionValeurActuelle: [1, 2, 3],
        évolutionDateValeurActuelle: ['2023-01-01', '2023-01-02', '2023-01-03'],
      },
    ]);

    // When
    await handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual([
      {
        'maille': 'départementale',
        'codeInsee': '75',
        'valeurCible': 123,
        'évolutionDateValeurActuelle': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'évolutionValeurActuelle': [1, 2, 3],
      },
    ]);
  });

  it('renvoyer une erreur si un des champs n\'est pas bien épelé', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', indicateur_id: 'IND-001', maille: 'DEPT', codes_insee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getEvolutionIndicateur = () => Promise.resolve([]);

    // When
    handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
