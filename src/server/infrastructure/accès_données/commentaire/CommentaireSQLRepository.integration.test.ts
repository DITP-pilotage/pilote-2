/* eslint-disable sonarjs/no-duplicate-string */
import { commentaire } from '@prisma/client';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES,
} from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { commentairesNull, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';

describe('CommentaireSQLRepository', () => {
  describe('findNewestByChantierIdAndTerritoire', () => {
    test('Retourne une liste de commentaire vide quand pas de commentaire en base', async () => {
      // GIVEN
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      // WHEN
      const commentaires = await commentaireRepository.findNewestByChantierIdAndTerritoire('CH-001', 'nationale', 'FR');

      // THEN
      await expect(commentaires).toStrictEqual(commentairesNull);
    });

    test('Retourne un dictionnaire de commentaires les plus récents', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const autresRésultatsObtenus = 'autresRésultatsObtenus';
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      const commentaires: commentaire[] = [
        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .avecContenu('Mon commentaire frein 2022')
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .avecContenu('Mon commentaire frein 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['actionsÀVenir'])
          .avecContenu('Mon commentaire action')
          .avecDate(new Date('2023-12-30'))
          .avecAuteur('Jean Nemar')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .avecContenu('Mon commentaire autres résultats')
          .avecDate(new Date('2022-01-01'))
          .avecAuteur('Jean')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .avecContenu('Mon commentaire autres résultats en dernier')
          .avecDate(new Date('2022-02-28'))
          .avecAuteur('Jean Christophe')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .avecContenu('Mon commentaire autres résultats ancien')
          .avecDate(new Date('2022-01-08'))
          .avecAuteur('Jean')
          .build(),
      ];

      await prisma.commentaire.createMany({ data: commentaires });


      // WHEN
      const result = await commentaireRepository.findNewestByChantierIdAndTerritoire('CH-001', 'nationale', 'FR');

      // THEN
      expect(result).toStrictEqual({
        freinsÀLever: {
          contenu: 'Mon commentaire frein 2023',
          date: '2023-12-31T00:00:00.000Z',
          auteur: 'Jean Bon',
        },
        actionsÀVenir: {
          contenu: 'Mon commentaire action',
          date: '2023-12-30T00:00:00.000Z',
          auteur: 'Jean Nemar',
        },
        actionsÀValoriser: null,
        autresRésultatsObtenus: {
          contenu: 'Mon commentaire autres résultats en dernier',
          date: '2022-02-28T00:00:00.000Z',
          auteur: 'Jean Christophe',
        },
      });
    });
  });

  describe('récupérerHistoriqueDUnCommentaire', () => {
    test('Retourne tous les commentaires du type donné pour un chantier et un territoire', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const typeCommentaire: TypeCommentaire = 'freinsÀLever';
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      const commentaires: commentaire[] = [
        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .avecContenu('Mon commentaire frein FR 2022')
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .avecContenu('Mon commentaire frein FR 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['actionsÀVenir'])
          .avecContenu('Mon commentaire action')
          .avecDate(new Date('2023-12-30'))
          .avecAuteur('Jean Nemar')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille('départementale')
          .avecCodeInsee('01')
          .avecType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .avecContenu('Mon commentaire frein département 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .build(),
      ];

      await prisma.commentaire.createMany({ data: commentaires });

      // WHEN
      const result = await commentaireRepository.récupérerHistoriqueDUnCommentaire(chantierId, maille, codeInsee, typeCommentaire);

      // THEN
      expect(result).toStrictEqual([
        {
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire frein FR 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire frein FR 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });
});
