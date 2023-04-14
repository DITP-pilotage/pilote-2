/* eslint-disable sonarjs/no-duplicate-string */
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';
import ObjectifSQLRepository, {
  CODES_TYPES_OBJECTIFS,
} from '@/server/infrastructure/accès_données/objectif/ObjectifSQLRepository';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

describe('ObjectifSQLRepository', function () {
  const chantierId = 'CH-001';
  const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);

  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const type: TypeObjectif = 'àFaire';
      const objectifs: Prisma.objectifCreateArgs['data'][] = [
        new ObjectifSQLRowBuilder()
          .avecId('123abc')
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif à faire blabla')
          .avecType(CODES_TYPES_OBJECTIFS[type])
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

      const result = await objectifRepository.récupérerLePlusRécent(chantierId, type);

      // THEN
      expect(result).toStrictEqual({
        id: '123abc',
        type,
        auteur: 'Jean Bon',
        contenu: 'Objectif à faire blabla',
        date: '2022-12-31T00:00:00.000Z',
      });
    });
  });

  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les objectifs pour un chantier', async () => {
      // GIVEN
      const type: TypeObjectif = 'notreAmbition';
      const objectifs: Prisma.objectifCreateArgs['data'][] = [
        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-04-01'))
          .avecType(CODES_TYPES_OBJECTIFS[type])
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-04-01'))
          .avecType(CODES_TYPES_OBJECTIFS[type])
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2021-12-31'))
          .avecType('deja_fait')
          .build(),
      ];

      await prisma.objectif.createMany({ data: objectifs });

      // WHEN
      const result = await objectifRepository.récupérerHistoriqueDUnObjectif(chantierId, type);

      // THEN
      expect(result[0]?.date).toStrictEqual('2023-04-01T00:00:00.000Z');
      expect(result[1]?.date).toStrictEqual('2022-04-01T00:00:00.000Z');
    });
  });

  describe('créer', () => {
    test('Crée le objectif en base', async () => {
      // Given
      const id = '123';
      const contenu = 'Quatrième objectif';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const type = 'notreAmbition';

      // When
      await objectifRepository.créer(chantierId, id, contenu, auteur, type, date);

      // Then
      const objectifCrééeEnBase = await prisma.objectif.findUnique({ where: { id: id } });
      expect(objectifCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le objectif créé', async () => {
      // Given
      const id = '123';
      const contenu = 'Quatrième objectif';
      const date = '2023-12-31T00:00:00.000Z';
      const auteur = 'Jean DUPONT';
      const type = 'notreAmbition';

      // When
      const objectifCréée = await objectifRepository.créer(chantierId, id, contenu, auteur, type, new Date(date));

      // Then
      expect(objectifCréée).toStrictEqual({
        id,
        type,
        contenu,
        auteur,
        date,
      });
    });
  });
});
