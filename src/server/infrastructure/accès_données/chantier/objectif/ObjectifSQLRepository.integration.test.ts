import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ObjectifRepository from '@/server/domain/chantier/objectif/ObjectifRepository.interface';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository';
import { TypeObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('ObjectifSQLRepository', function () {
  let objectifRepository: ObjectifRepository;

  beforeEach(() => {
    objectifRepository = new ObjectifSQLRepository(prisma);
  });

  describe('récupérerLePlusRécent', () => {
    test('retourne l\'objectif avec un contenu, un auteur et une date le plus récent', async () => {
      // Given
      const type: TypeObjectif = 'àFaire';
      // When
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.objectif.createMany({
        data: [{
          id: '2354f938-13be-4821-817f-38ff6fc75591',
          chantier_id: 'CH-001',
          date: new Date('2022-12-31'),
          contenu: 'Objectif à faire',
          type: 'a_faire',
        }, {
          id: '7dd1e7e2-11ba-4159-b585-4ba8094c863c',
          chantier_id: 'CH-001',
          date: new Date('2022-12-31'),
          contenu: 'Objectif déjà fait',
          type: 'deja_fait',
        }, {
          id: 'c92d023d-f725-427c-af97-6443268ad5b3',
          chantier_id: 'CH-001',
          date: new Date('2022-12-31'),
          contenu: 'Objectif notre ambition plus recent',
          type: 'notre_ambition',
        }, {
          id: '4b55a4a2-d91b-4c08-b4aa-c11eb2b31ba0',
          chantier_id: 'CH-001',
          date: new Date('2023-12-31'),
          contenu: 'Objectif notre ambition plus ancien',
          type: 'notre_ambition',
        }],
      });

      const result = await objectifRepository.récupérerLePlusRécent('CH-001', type);

      // Then
      expect(result).toStrictEqual({
        id: '2354f938-13be-4821-817f-38ff6fc75591',
        type,
        auteur: 'Auteur Inconnu',
        contenu: 'Objectif à faire',
        date: '2022-12-31T00:00:00.000Z',
      });
    });

    test('Quand l\id auteur est null, retourne Auteur Inconnu', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.objectif.create({
        data: {
          id: '2354f938-13be-4821-817f-38ff6fc75591',
          chantier_id: 'CH-001',
          date: new Date('2022-12-31'),
          contenu: 'Objectif à faire',
          type: 'a_faire',
          auteur_id: null,
        },
      });

      // When
      const result = await objectifRepository.récupérerLePlusRécent('CH-001', 'àFaire');

      // Then
      expect(result).toStrictEqual({
        id: '2354f938-13be-4821-817f-38ff6fc75591',
        type: 'àFaire',
        auteur: 'Auteur Inconnu',
        contenu: 'Objectif à faire',
        date: '2022-12-31T00:00:00.000Z',
      });
    });

    test("Quand l'id auteur est non null, retourne prenom + nom de l'utilisateur associé", async () => {
      // Given
      const auteur_id = '41b6b8d4-cff6-404f-a726-c095c438ee92';
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
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
      await prisma.objectif.create({
        data: {
          id: '2354f938-13be-4821-817f-38ff6fc75591',
          chantier_id: 'CH-001',
          date: new Date('2022-12-31'),
          contenu: 'Objectif à faire',
          type: 'a_faire',
          auteur_id,
        },
      });
      // When

      const result = await objectifRepository.récupérerLePlusRécent('CH-001', 'àFaire');

      // Then
      expect(result).toStrictEqual({
        id: '2354f938-13be-4821-817f-38ff6fc75591',
        type: 'àFaire',
        auteur: 'Steve Savidan',
        contenu: 'Objectif à faire',
        date: '2022-12-31T00:00:00.000Z',
      });
    });
  });

  describe('récupérerHistoriqueDUnObjectif', () => {
    test('Retourne, par ordre antéchronologique, tous les objectifs pour un type et un chantier', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
      await prisma.objectif.createMany({
        data: [{
          id: '2354f938-13be-4821-817f-38ff6fc75591',
          chantier_id: 'CH-001',
          date: new Date('2022-04-01'),
          contenu: 'Objectif notre ambition entre 2 dates',
          type: 'notre_ambition',
        }, {
          id: '7a16426d-7abb-40f3-88ac-b8873b99c8bc',
          chantier_id: 'CH-001',
          date: new Date('2023-04-01'),
          contenu: 'Objectif notre ambition plus recent',
          type: 'notre_ambition',
        }, {
          id: '93fecdd7-f68f-4f9a-8aa5-2fe7d4d983f3',
          chantier_id: 'CH-001',
          date: new Date('2021-12-31'),
          contenu: 'Objectif déjà fait plus ancien',
          type: 'notre_ambition',
        }] });

      // When
      const result = await objectifRepository.récupérerHistorique('CH-001', 'notreAmbition');

      // Then
      expect(result.at(0)?.date).toStrictEqual('2023-04-01T00:00:00.000Z');
      expect(result.at(1)?.date).toStrictEqual('2022-04-01T00:00:00.000Z');
    });
  });

  describe('créer', () => {
    test('Crée le objectif en base', async () => {
      // Given
      const id = '123';
      const contenu = 'Quatrième objectif';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const type = 'notreAmbition';
      const auteur_id = 'ce68cbcd-e67c-48ea-bd0d-061b310e18ce';
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
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      // When
      await objectifRepository.créer('CH-001', id, contenu, auteur_id, type, date);

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
      const auteur_id = '0b2743db-72ac-4613-bcd9-851e767722a4';
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
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
      const objectifCréée = await objectifRepository.créer('CH-001', id, contenu, auteur_id, type, new Date(date));

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

  describe('récupérerLesPlusRécentsGroupésParChantier', () => {
    test('retourne les objectifs les plus récent groupé par chantier', async () => {
      // Given
      const auteur_id = 'ce68cbcd-e67c-48ea-bd0d-061b310e18ce';
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

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
      });
      await prisma.objectif.createMany({
        data: [{
          id: '2354f938-13be-4821-817f-38ff6fc75591',
          chantier_id: 'CH-001',
          date: new Date('2022-04-01'),
          contenu: 'Objectif notre ambition entre 2 dates',
          type: 'notre_ambition',
          auteur_id,
        }, {
          id: '7a16426d-7abb-40f3-88ac-b8873b99c8bc',
          chantier_id: 'CH-001',
          date: new Date('2023-04-01'),
          contenu: 'Objectif notre ambition plus recent',
          type: 'notre_ambition',
          auteur_id,
        }, {
          id: 'f49556f6-6490-4c14-9ccd-24808731f41f',
          chantier_id: 'CH-001',
          date: new Date('2023-04-01'),
          contenu: 'Objectif notre ambition plus recent',
          type: 'a_faire',
          auteur_id,
        }, {
          id: '6d818ff8-b66c-47af-88f9-7a57702061c5',
          chantier_id: 'CH-001',
          date: new Date('2023-04-02'),
          contenu: 'Objectif deja fait plus recent',
          type: 'deja_fait',
        }, {
          id: '93fecdd7-f68f-4f9a-8aa5-2fe7d4d983f3',
          chantier_id: 'CH-001',
          date: new Date('2021-12-31'),
          contenu: 'Objectif déjà fait plus ancien',
          type: 'notre_ambition',
          auteur_id,
        }, {
          id: '57f99fce-9db0-4079-83f0-144c27ec1dca',
          chantier_id: 'CH-002',
          date: new Date('2022-04-01'),
          contenu: 'Objectif notre ambition entre 2 dates ch2',
          type: 'notre_ambition',
          auteur_id,
        }, {
          id: 'ab310903-3d61-41d3-9adf-31cbd4ff8f68',
          chantier_id: 'CH-002',
          date: new Date('2023-04-03'),
          contenu: 'Objectif notre ambition plus recent ch2',
          type: 'notre_ambition',
          auteur_id,
        }, {
          id: '665da850-5446-4cc9-ab5a-c24304c12550',
          chantier_id: 'CH-003',
          date: new Date('2023-04-01'),
          contenu: 'Objectif notre ambition plus recent ch2',
          type: 'notre_ambition',
          auteur_id,
        }] });

      // When
      const result = await objectifRepository.récupérerLesPlusRécentsGroupésParChantier(['CH-001', 'CH-002']);

      // Then
      expect(result['CH-001']).toIncludeAllMembers([{
        id: '6d818ff8-b66c-47af-88f9-7a57702061c5',
        type: 'déjàFait',
        contenu: 'Objectif deja fait plus recent',
        date: new Date('2023-04-02').toISOString(),
        auteur: 'Auteur Inconnu',
      }, {
        id: 'f49556f6-6490-4c14-9ccd-24808731f41f',
        type: 'àFaire',
        contenu: 'Objectif notre ambition plus recent',
        date: new Date('2023-04-01').toISOString(),
        auteur: 'Doe John',
      }, {
        id: '7a16426d-7abb-40f3-88ac-b8873b99c8bc',
        type: 'notreAmbition',
        contenu: 'Objectif notre ambition plus recent',
        date: new Date('2023-04-01').toISOString(),
        auteur: 'Doe John',
      }],
      );
      expect(result['CH-002']).toIncludeAllMembers([{
        id: 'ab310903-3d61-41d3-9adf-31cbd4ff8f68',
        auteur: 'Doe John',
        type: 'notreAmbition',
        contenu: 'Objectif notre ambition plus recent ch2',
        date: new Date('2023-04-03').toISOString(),
      }]);
    });
  });
});
