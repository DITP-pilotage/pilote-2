/* eslint-disable sonarjs/no-duplicate-string */
import { createMocks } from 'node-mocks-http';
import RécupérerLHistoriqueDUnCommentaireUseCase
  from '@/server/usecase/commentaire/RécupérerLHistoriqueDUnCommentaireUseCase';
import CommentaireBuilder from '@/server/domain/commentaire/Commentaire.builder';
import handleHistoriqueDUnCommentaire from './historiqueDUnCommentaire';

describe('/api/chantier/:chantierId/historique-du-chantier', () => {

  test('renvoie un tableau vide quand il n\'y a aucun commentaire', async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25', type: 'freinsÀLever' },
    });
    const historiqueDUnCommentaire =  {
      historiqueDUnCommentaire: [],
    };
    const stubRécupérerLHistoriqueDUnCommentaireUseCase = <RécupérerLHistoriqueDUnCommentaireUseCase>{};
    stubRécupérerLHistoriqueDUnCommentaireUseCase.run = () => Promise.resolve(historiqueDUnCommentaire);

    // WHEN
    await handleHistoriqueDUnCommentaire(req, res, stubRécupérerLHistoriqueDUnCommentaireUseCase);

    // THEN
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual(historiqueDUnCommentaire);
  });

  test('renvoie l\'historique des commentaires enregistrés en base de données', async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25', type: 'freinsÀLever' },
    });

    const fauxCommentaires = new CommentaireBuilder().build();

    const historiqueDUnCommentaire =  {
      historiqueDUnCommentaire: [
        fauxCommentaires['freinsÀLever'],
      ],
    };
    const stubRécupérerLHistoriqueDUnCommentaireUseCase = <RécupérerLHistoriqueDUnCommentaireUseCase>{};
    stubRécupérerLHistoriqueDUnCommentaireUseCase.run = () => Promise.resolve(historiqueDUnCommentaire);

    // WHEN
    await handleHistoriqueDUnCommentaire(req, res, stubRécupérerLHistoriqueDUnCommentaireUseCase);

    // THEN
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual(historiqueDUnCommentaire);
  });
});

describe('quand les paramètres sont incomplets', () => {

  test("erreur 400, quand le paramètre 'chantierId' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { maille: 'départementale', codeInsee: '27', type: 'freinsÀLever' },
    });
      // WHEN
    await handleHistoriqueDUnCommentaire(req, res, <RécupérerLHistoriqueDUnCommentaireUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  test("erreur 400, quand le paramètre 'maille' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', codeInsee: '28', type: 'freinsÀLever' },
    });
      // WHEN
    await handleHistoriqueDUnCommentaire(req, res, <RécupérerLHistoriqueDUnCommentaireUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  test("erreur 400, quand le paramètre 'codeInsee' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', type: 'freinsÀLever' },
    });
      // WHEN
    await handleHistoriqueDUnCommentaire(req, res, <RécupérerLHistoriqueDUnCommentaireUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  test("erreur 400, quand le paramètre 'type' manquant", async () => {
    // GIVEN
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '26' },
    });
      // WHEN
    await handleHistoriqueDUnCommentaire(req, res, <RécupérerLHistoriqueDUnCommentaireUseCase>{});
    // THEN
    expect(res._getStatusCode()).toBe(400);
  });

  describe('quand le format des paramètres est invalide', () => {
    test("erreur 400, quand le paramètre 'type' n'est pas un type de commentaire valide", async () => {
      // GIVEN
      const { req, res } = createMocks({
        method: 'GET',
        query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '26', type: 'TYPE_DE_COMMENTAIRE_INVALIDE' },
      });
      // WHEN
      await handleHistoriqueDUnCommentaire(req, res, <RécupérerLHistoriqueDUnCommentaireUseCase>{});
      // THEN
      expect(res._getStatusCode()).toBe(400);
    });
  });
});
