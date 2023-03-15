import { createMocks } from 'node-mocks-http';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import handleIndicateurRépartitionsGéographiques from './repartitions_geographiques';

describe('/api/indicateur/:indicateurId/repartitions_geographiques', () => {
  it('renvoyer la cartographie pour l\'ensemble des territoires', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { indicateurId: 'IND-001', maille: 'DEPT' },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getCartographieDonnéesParMailleEtIndicateurId = () => Promise.resolve({
      '01': {
        avancementAnnuel : 50,
        valeurActuelle: 155,
      },
      '02': {
        avancementAnnuel : 70,
        valeurActuelle: 130,
      },
    });

    // When
    await handleIndicateurRépartitionsGéographiques(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({
      '01': {
        avancementAnnuel : 50,
        valeurActuelle: 155,
      },
      '02': {
        avancementAnnuel : 70,
        valeurActuelle: 130,
      },
    });
  });

  it('renvoyer une erreur si un des champs n\'est pas bien épelé', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'IND-001', maille: 'DEPT' },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getCartographieDonnéesParMailleEtIndicateurId = () => Promise.resolve({});

    // When
    handleIndicateurRépartitionsGéographiques(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
