import { createMocks } from 'node-mocks-http';
import RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase
  from '@/server/usecase/synthèse/RécupérerHistoriqueSynthèseDesRésultatsUseCase';
import { Météo } from '@/server/domain/météo/Météo.interface';
import handleHistoriqueDeLaSynthèseDesRésultats from './historiqueDeLaSynthèseDesRésultats';

describe('/api/chantier/:chantierId/historique-de-la-synthèse-des-résultats', () => {

  test('renvoie un tableau vide quand il n\'y a aucune synthèse des résultats', async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25' },
    });
    const historiqueDeLaSynthèseDesRésultats =  {
      historiqueDeLaSynthèseDesRésultats: [],
    };
    const stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase = <RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase>{};
    stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase.run = () => Promise.resolve(historiqueDeLaSynthèseDesRésultats);

    // WHEN
    await handleHistoriqueDeLaSynthèseDesRésultats(req, res, stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase);

    // THEN
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual(historiqueDeLaSynthèseDesRésultats);
  });

  test('renvoie l\'historique des synthèses des résultats enregistrés en base de données', async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25' },
    });
    const historiqueDeLaSynthèseDesRésultats =  {
      historiqueDeLaSynthèseDesRésultats: [
        {
          auteur: 'Jean Bon',
          contenu: 'Ma synthèse DEPT-25 2023',
          date: '2023-12-31T00:00:00.000Z',
          id: 'aaaaaa-aaaa',
          météo: 'SOLEIL' as Météo,
        }, {
          auteur: 'Jean Bon',
          contenu: 'Ma synthèse DEPT-25 2022',
          date: '2022-12-31T00:00:00.000Z',
          id: 'aaaaaa-aaaa',
          météo: 'SOLEIL' as Météo,
        },
      ],
    };
    const stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase = <RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase>{};
    stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase.run = () => Promise.resolve(historiqueDeLaSynthèseDesRésultats);

    // WHEN
    await handleHistoriqueDeLaSynthèseDesRésultats(req, res, stubRécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase);

    // THEN
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual(historiqueDeLaSynthèseDesRésultats);
  });
});

describe('quand les paramètres sont incomplets', () => {

  test("erreur 400, quand le paramètre 'chantierId' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { maille: 'départementale', codeInsee: '27' },
    });
      // WHEN
    await handleHistoriqueDeLaSynthèseDesRésultats(req, res, <RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  test("erreur 400, quand le paramètre 'maille' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', codeInsee: '28' },
    });
      // WHEN
    await handleHistoriqueDeLaSynthèseDesRésultats(req, res, <RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  test("erreur 400, quand le paramètre 'codeInsee' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale' },
    });
      // WHEN
    await handleHistoriqueDeLaSynthèseDesRésultats(req, res, <RécupérerLHistoriqueDeLaSynthèseDesRésultatsUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });
});
