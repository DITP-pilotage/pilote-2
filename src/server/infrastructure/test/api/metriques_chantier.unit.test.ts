import { createMocks } from 'node-mocks-http';
import handle from '../../../../pages/api/chantier/[chantierId]';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

describe('/api/chantier/:chantierId:', () => {
  it('renvoyer la synthèse des résultats d\'un chantier', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', codeInsee: ['75'] },
    });
    const stubChantierRepository = <ChantierRepository>{};
    stubChantierRepository.getMetriques = () => Promise.resolve({
      synthèseDesRésultats: {
        commentaire: 'Lorem ipsum',
        date: '2023-01-01',
        auteur: 'Jean Arnaud',
      },
    });

    // When
    await handle(req, res, stubChantierRepository);

    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({
      synthèseDesRésultats: {
        commentaire: 'Lorem ipsum',
        date: '2023-01-01',
        auteur: 'Jean Arnaud',
      },
    });
  });

  it('renvoyer une erreur si un des champs n\'est pas bien épelé', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', toto: ['75'] },
    });
    const stubChantierRepository = <ChantierRepository>{};
    stubChantierRepository.getMetriques = () => Promise.resolve({
      synthèseDesRésultats: {
        commentaire: '',
        date: '',
        auteur: '',
      },
    });

    // When
    handle(req, res, stubChantierRepository);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
