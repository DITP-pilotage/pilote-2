import { createMocks } from 'node-mocks-http';
import { commentairesNull } from '@/server/domain/commentaire/Commentaire.interface';
import {
  RécupérerLeDétailDUnChantierTerritorialiséeUseCase,
} from '@/server/usecase/chantier/RécupérerLeDétailDUnChantierTerritorialiséeUseCase';
import handleChantierId from './[chantierId]';

describe('/api/chantier/:chantierId:', () => {
  it('renvoyer la synthèse des résultats d\'un chantier', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', codeInsee: ['75'] },
    });
    const stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase = <RécupérerLeDétailDUnChantierTerritorialiséeUseCase>{};
    stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase.run = () => Promise.resolve({
      synthèseDesRésultats: {
        contenu: 'Lorem ipsum',
        date: '2023-01-01',
        auteur: 'Jean Arnaud',
      },
      météo: 'NON_RENSEIGNEE',
      commentaires: commentairesNull,
    });

    // When
    await handleChantierId(req, res, stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase);

    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({
      synthèseDesRésultats: {
        contenu: 'Lorem ipsum',
        date: '2023-01-01',
        auteur: 'Jean Arnaud',
      },
      météo: 'NON_RENSEIGNEE',
      commentaires: commentairesNull,
    });
  });

  it('renvoyer une erreur si un des champs n\'est pas bien épelé', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'DEPT', toto: ['75'] },
    });
    const stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase = <RécupérerLeDétailDUnChantierTerritorialiséeUseCase>{};
    stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase.run = () => Promise.resolve({
      synthèseDesRésultats: {
        contenu: '',
        date: '',
        auteur: '',
      },
      météo: 'NON_RENSEIGNEE',
      commentaires: commentairesNull,
    });

    // When
    handleChantierId(req, res, stubRécupérerLeDétailDUnChantierTerritorialiséeUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });
});
