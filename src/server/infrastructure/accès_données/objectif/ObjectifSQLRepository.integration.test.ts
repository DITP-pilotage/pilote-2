/* eslint-disable sonarjs/no-duplicate-string */
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/objectif/ObjectifSQLRepository';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';

describe('ObjectifSQLRepository ', function () {
  const chantierId = 'CH-001';
  const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);

  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const objectifs: Prisma.objectifCreateArgs['data'][] = [
        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif à faire blabla')
          .avecType('a_faire')
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif déjà fait blabla')
          .avecType('deja_fait')
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif notre ambition blabla')
          .avecType('notre_ambition')
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif notre ambition blabla')
          .avecType('notre_ambition')
          .build(),
      ];

      // WHEN
      await prisma.objectif.createMany({ data: objectifs });

      const result = await objectifRepository.récupérerLePlusRécentPourChaqueType(chantierId);

      // THEN
      expect(result).toStrictEqual({
        notreAmbition: {
          auteur: '',
          contenu: 'Objectif notre ambition blabla',
          date: '2023-12-31T00:00:00.000Z',
        },
        déjàFait: {
          auteur: '',
          contenu: 'Objectif déjà fait blabla',
          date: '2022-12-31T00:00:00.000Z',
        },
        àFaire: {
          auteur: '',
          contenu: 'Objectif à faire blabla',
          date: '2022-12-31T00:00:00.000Z',
        },
      });
    });
  });

  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les objectifs pour un chantier', async () => {
      // GIVEN
      const objectifs: Prisma.objectifCreateArgs['data'][] = [
        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-04-01'))
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-04-01'))
          .build(),
      ];

      await prisma.objectif.createMany({ data: objectifs });

      // WHEN
      const result = await objectifRepository.récupérerHistoriqueDUnObjectif(chantierId);

      // THEN
      expect(result[0]?.date).toStrictEqual('2023-04-01T00:00:00.000Z');
      expect(result[1]?.date).toStrictEqual('2022-04-01T00:00:00.000Z');
    });
  });
});
