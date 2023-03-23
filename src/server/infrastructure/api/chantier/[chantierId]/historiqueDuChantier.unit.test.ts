/* eslint-disable sonarjs/no-duplicate-string */
import { createMocks } from 'node-mocks-http';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import handleChantierIdHistoriqueDuCommentaire from './historiqueDuChantier';

describe('/api/chantier/:chantierId/historique-du-chantier', () => {
  describe('dans le cas nominal', () => {

    test('renvoie l\'historique des commentaires enregistrés en base de données', async () => {
      // GIVEN
      const { req, res } = createMocks({
        method: 'GET',
        query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25', type: 'freinsÀLever' },
      });
      const stubCommentaireRepository = <CommentaireRepository>{};
      stubCommentaireRepository.findAllByChantierIdAndTerritoireAndType = () => Promise.resolve([]);

      // WHEN
      await handleChantierIdHistoriqueDuCommentaire(req, res, stubCommentaireRepository);

      // THEN
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toStrictEqual({
        historiqueDuCommentaire: [],
      });
    });

    test('renvoie l\'historique des commentaires enregistrés en base de données', async () => {
      // GIVEN
      const { req, res } = createMocks({
        method: 'GET',
        query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '25', type: 'freinsÀLever' },
      });
      const historiqueDuCommentaire = [
        {
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ];
      const stubCommentaireRepository = <CommentaireRepository>{};
      stubCommentaireRepository.findAllByChantierIdAndTerritoireAndType = () => Promise.resolve(historiqueDuCommentaire);

      // WHEN
      await handleChantierIdHistoriqueDuCommentaire(req, res, stubCommentaireRepository);

      // THEN
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toStrictEqual({
        historiqueDuCommentaire,
      });
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
      await handleChantierIdHistoriqueDuCommentaire(req, res, <CommentaireRepository>{});
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
      await handleChantierIdHistoriqueDuCommentaire(req, res, <CommentaireRepository>{});
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
      await handleChantierIdHistoriqueDuCommentaire(req, res, <CommentaireRepository>{});
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
      await handleChantierIdHistoriqueDuCommentaire(req, res, <CommentaireRepository>{});
      // THEN
      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('quand le format des paramètres est invalide', () => {
    test("erreur 400, quand le paramètre 'type' n'est pas un type de commentaire valide", async () => {
      // GIVEN
      const { req, res } = createMocks({
        method: 'GET',
        query: { chantierId: 'CH-001', maille: 'départementale', codeInsee: '26', type: 'TYPE_DE_COMMENTAIRE_INVALIDE' },
      });
      // WHEN
      await handleChantierIdHistoriqueDuCommentaire(req, res, <CommentaireRepository>{});
      // THEN
      expect(res._getStatusCode()).toBe(400);
    });
  });
});
