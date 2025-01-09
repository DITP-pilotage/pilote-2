import { objectif as objectifModel } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import ObjectifSQLRepository, {
  CODES_TYPES_OBJECTIFS,
} from '@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import { TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('ObjectifSQLRepository', function () {
  const chantierId = 'CH-001';
  const objectifRepository: ObjectifRepository = new ObjectifSQLRepository(prisma);

  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // GIVEN
      const auteur_id = randomUUID();
      const type: TypeObjectif = 'àFaire';
      const objectifs: objectifModel[] = [
        new ObjectifSQLRowBuilder()
          .avecId('123abc')
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecContenu('Objectif à faire blabla')
          .avecType(CODES_TYPES_OBJECTIFS[type])
          .avecAuteurID(auteur_id)
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecContenu('Objectif déjà fait blabla')
          .avecType('deja_fait')
          .avecAuteurID(auteur_id)
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-12-31'))
          .avecContenu('Objectif notre ambition blabla')
          .avecType('notre_ambition')
          .avecAuteurID(auteur_id)
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-12-31'))
          .avecContenu('Objectif notre ambition blabla')
          .avecType('notre_ambition')
          .avecAuteurID(auteur_id)
          .build(),
      ];

      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Savidan',
          prenom: 'Steve',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      // WHEN
      await prisma.objectif.createMany({ data: objectifs });

      const result = await objectifRepository.récupérerLePlusRécent(chantierId, type);

      // THEN
      expect(result).toStrictEqual({
        id: '123abc',
        type,
        auteur: 'Steve Savidan',
        contenu: 'Objectif à faire blabla',
        date: '2022-12-31T00:00:00.000Z',
      });
    });
    test('retourne prenom + nom de l\'utilisateur associé', async () => {
      // GIVEN
      const type: TypeObjectif = 'àFaire';
      const auteur_id = randomUUID();
      const objectif = new ObjectifSQLRowBuilder()
        .avecId('123abc')
        .avecAuteurID(auteur_id)
        .avecChantierId('CH-003')
        .avecDate(new Date('2022-12-31'))
        .avecContenu('Objectif à faire blabla')
        .avecType(CODES_TYPES_OBJECTIFS[type])
        .build();

      // WHEN
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Savidan',
          prenom: 'Steve',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });
      await prisma.objectif.create({ data: objectif });

      const result = await objectifRepository.récupérerLePlusRécent('CH-003', type);

      // THEN
      expect(result).toStrictEqual({
        id: '123abc',
        type,
        auteur: 'Steve Savidan',
        contenu: 'Objectif à faire blabla',
        date: '2022-12-31T00:00:00.000Z',
      });
    });
  });

  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les objectifs pour un type et un chantier', async () => {
      // GIVEN
      const auteur_id = randomUUID();
      const type: TypeObjectif = 'notreAmbition';
      const objectifs: objectifModel[] = [
        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2022-04-01'))
          .avecType(CODES_TYPES_OBJECTIFS[type])
          .avecAuteurID(auteur_id)
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-04-01'))
          .avecType(CODES_TYPES_OBJECTIFS[type])
          .avecAuteurID(auteur_id)
          .build(),

        new ObjectifSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2021-12-31'))
          .avecType('deja_fait')
          .avecAuteurID(auteur_id)
          .build(),
      ];

      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Savidan',
          prenom: 'Steve',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.objectif.createMany({ data: objectifs });

      // WHEN
      const result = await objectifRepository.récupérerHistorique(chantierId, type);

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
      const type = 'notreAmbition';
      const auteur_id = randomUUID();
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'John',
          prenom: 'Doe',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });
      // When
      await objectifRepository.créer(chantierId, id, contenu, auteur_id, type, date);

      // Then
      const objectifCrééeEnBase = await prisma.objectif.findUnique({ where: { id: id } });
      expect(objectifCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le objectif créé', async () => {
      // Given
      const id = '123';
      const contenu = 'Quatrième objectif';
      const date = '2023-12-31T00:00:00.000Z';
      const type = 'notreAmbition';
      const auteur_id = randomUUID();
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'John',
          prenom: 'Doe',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      // When
      const objectifCréée = await objectifRepository.créer(chantierId, id, contenu, auteur_id, type, new Date(date));

      // Then
      expect(objectifCréée).toStrictEqual({
        id,
        type,
        contenu,
        auteur: 'Doe John',
        date,
      });
    });
  });
});
