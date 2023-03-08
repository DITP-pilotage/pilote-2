import { createMocks } from 'node-mocks-http';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import handle from '../../../../pages/api/chantier/[chantierId]/indicateurs';

describe('/api/detail_indicateur', () => {
  it('renvoyer une liste vide de fiche indicateur', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départemental', codesInsee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getFichesIndicateurs = () => Promise.resolve({});

    // When
    handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
  });

  it('renvoyer les détails d\'un indicateur', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', codesInsee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getFichesIndicateurs = () => Promise.resolve({
      'IND-002': {
        '02': {
          codeInsee: '02',
          valeurInitiale: 1001,
          dateValeurInitiale: '2022-01-01T00:00:00.000Z',
          valeurs: [1, 4, 6],
          dateValeurs: ['2022-01-02T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
          valeurCible: 1790,
          avancement: {
            global: 40,
            annuel: null,
          },
        },
      },
    });

    // When
    await handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({
      'IND-002': {
        '02': {
          codeInsee: '02',
          valeurInitiale: 1001,
          dateValeurInitiale: '2022-01-01T00:00:00.000Z',
          valeurs: [1, 4, 6],
          dateValeurs: ['2022-01-02T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
          valeurCible: 1790,
          avancement: {
            global: 40,
            annuel: null,
          },
        },
      },
    });
  });

  it('renvoyer une erreur si un des champs n\'est pas bien épelé', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', codes_insee: ['75'] },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getFichesIndicateurs = () => Promise.resolve({});

    // When
    handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
