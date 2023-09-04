import { faker } from '@faker-js/faker';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import ObjectifProjetStructurantSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifProjetStructurantSQLRow.builder';
import ObjectifProjetStructurantSQLRepository from './ObjectifProjetStructurantSQLRepository';

describe('ObjectifSQLRepository', function () {
  const projetStructurantId = faker.datatype.uuid();
  const objectifRepository: ObjectifProjetStructurantRepository = new ObjectifProjetStructurantSQLRepository(prisma);

  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const type: TypeObjectifProjetStructurant = 'SuiviDesObjectifs';
      const objectifs: Prisma.objectif_projet_structurantCreateArgs['data'][] = [
        new ObjectifProjetStructurantSQLRowBuilder()
          .avecId('123abc')
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2025-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif à faire blabla')
          .build(),

        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif déjà fait blabla')
          .build(),

        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif notre ambition blabla')
          .build(),

        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2024-12-31'))
          .avecAuteur('Jean Bon')
          .avecContenu('Objectif notre ambition blabla')
          .build(),
      ];

      // WHEN
      await prisma.objectif_projet_structurant.createMany({ data: objectifs });

      const result = await objectifRepository.récupérerLePlusRécent(projetStructurantId);

      // THEN
      expect(result).toStrictEqual({
        id: '123abc',
        type,
        auteur: 'Jean Bon',
        contenu: 'Objectif à faire blabla',
        date: '2025-12-31T00:00:00.000Z',
      });
    });
  });

  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les objectifs pour un projet structurant', async () => {
      // GIVEN
      const type: TypeObjectifProjetStructurant = 'SuiviDesObjectifs';
      const objectifs: Prisma.objectif_projet_structurantCreateArgs['data'][] = [
        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2022-04-01'))
          .build(),

        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecDate(new Date('2023-04-01'))
          .build(),

        new ObjectifProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(faker.datatype.uuid())
          .avecDate(new Date('2021-12-31'))
          .build(),
      ];

      await prisma.objectif_projet_structurant.createMany({ data: objectifs });

      // WHEN
      const result = await objectifRepository.récupérerHistorique(projetStructurantId, type);

      // THEN
      expect(result[0]?.date).toStrictEqual('2023-04-01T00:00:00.000Z');
      expect(result[1]?.date).toStrictEqual('2022-04-01T00:00:00.000Z');
    });
  });

  describe('créer', () => {
    test('Crée le objectif en base', async () => {
      // Given
      const id = '4136cd0b-d90b-4af7-b485-5d1ded8db252';
      const contenu = 'Quatrième objectif';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const type = 'SuiviDesObjectifs';

      // When
      await objectifRepository.créer(projetStructurantId, id, contenu, auteur, type, date);

      // Then
      const objectifCrééeEnBase = await prisma.objectif_projet_structurant.findUnique({ where: { id: id } });
      expect(objectifCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le objectif créé', async () => {
      // Given
      const id = '4136cd0b-d90b-4af7-b485-5d1ded8db252';
      const contenu = 'Quatrième objectif';
      const date = '2023-12-31T00:00:00.000Z';
      const auteur = 'Jean DUPONT';
      const type = 'SuiviDesObjectifs';

      // When
      const objectifCréée = await objectifRepository.créer(projetStructurantId, id, contenu, auteur, type, new Date(date));

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
