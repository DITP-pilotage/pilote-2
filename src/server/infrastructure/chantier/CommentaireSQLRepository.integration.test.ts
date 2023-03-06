import { commentaire } from '@prisma/client';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES,
} from '@/server/infrastructure/chantier/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { commentairesNull } from '@/server/domain/chantier/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/CommentaireRowBuilder';

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

      const commentaireRowBuilder = new CommentaireRowBuilder();

      const commentaires: commentaire[] = [
        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .withContenu('Mon commentaire frein 2022')
          .withDate('2022-12-31')
          .withAuteur('Jean Bon')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES['freinsÀLever'])
          .withContenu('Mon commentaire frein 2023')
          .withDate('2023-12-31')
          .withAuteur('Jean Bon')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES['actionsÀVenir'])
          .withContenu('Mon commentaire action')
          .withDate('2023-12-30')
          .withAuteur('Jean Nemar')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .withContenu('Mon commentaire autres résultats')
          .withDate('2022-01-01')
          .withAuteur('Jean')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .withContenu('Mon commentaire autres résultats en dernier')
          .withDate('2022-02-28')
          .withAuteur('Jean Christophe')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType(CODES_TYPES_COMMENTAIRES[autresRésultatsObtenus])
          .withContenu('Mon commentaire autres résultats ancien')
          .withDate('2022-01-02')
          .withAuteur('Jean')
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
});
