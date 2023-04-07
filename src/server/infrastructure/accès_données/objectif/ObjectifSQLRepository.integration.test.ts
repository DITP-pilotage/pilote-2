import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/objectif/ObjectifSQLRepository';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';

describe('ObjectifSQLRepository ', function () {
  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);

      const commentaires: Prisma.commentaireCreateArgs['data'][] = [
        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType('objectifs')
          .avecContenu('Mon objectif 2022')
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType('objectifs')
          .avecContenu('Mon objectif 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
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
  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les commentaires du type donné pour un chantier et un territoire', async () => {
      // GIVEN
      const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);
      const objectifs: Prisma.objectifCreateArgs['data'][] = [
        new ObjectifSQLRowBuilder()
          .build(),
      ];

      // WHEN

      // THEN
    });
  });
});
