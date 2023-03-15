import { commentaire } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/objectif/ObjectifSQLRepository';
import CommentaireRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/CommentaireRowBuilder';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';

describe('ObjectifSQLRepository ', function () {
  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);

      const commentaireRowBuilder = new CommentaireRowBuilder();

      const commentaires: commentaire[] = [
        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType('objectifs')
          .withContenu('Mon objectif 2022')
          .withDate('2022-12-31')
          .withAuteur('Jean Bon')
          .build(),

        commentaireRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withType('objectifs')
          .withContenu('Mon objectif 2023')
          .withDate('2023-12-31')
          .withAuteur('Jean Bon')
          .build(),
      ];

      // WHEN
      await prisma.commentaire.createMany({ data: commentaires });

      const result = await objectifRepository.récupérerLePlusRécent('CH-001');

      // THEN
      expect(result).toStrictEqual({
        contenu: 'Mon objectif 2023',
        date: '2023-12-31T00:00:00.000Z',
        auteur: '',
      });
    });
  });
});
