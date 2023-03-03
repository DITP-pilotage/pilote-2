import { createMocks } from 'node-mocks-http';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import handle from '../../../../pages/api/indicateur/[indicateurId]/répartitions_géographiques';

describe('/api/indicateur/:indicateurId:/répartitions_géographiques', () => {
  it('renvoyer la cartographie pour l\'ensemble des territoires', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { indicateurId: 'IND-001', maille: 'DEPT' },
    });
    const stubIndicateurRepository = <IndicateurRepository>{};
    stubIndicateurRepository.getCartographieDataByMailleAndIndicateurId = () => Promise.resolve({
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
    await handle(req, res, stubIndicateurRepository);

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
    stubIndicateurRepository.getCartographieDataByMailleAndIndicateurId = () => Promise.resolve({});

    // When
    handle(req, res, stubIndicateurRepository);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
