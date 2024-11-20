import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/db/prisma';
import DécisionStratégiqueRepository from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import DécisionStratégiqueSQLRepository from './DécisionStratégiqueSQLRepository';

describe('DécisionStratégiqueSQLRepository', () => {
  // Given
  const chantierId = 'CH-001';
  const auteur_id = randomUUID();
  let décisionStratégiqueRepository: DécisionStratégiqueRepository;

  beforeEach(() => {
    décisionStratégiqueRepository = new DécisionStratégiqueSQLRepository();
  });

  describe('#récupérerLePlusRécent', () => {
    it('Retourne la décision stratégique la plus récente pour un chantier avec son contenu, auteur et date', async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Lasne',
          prenom: 'Paul',
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
          id: 'CH-003',
          nom: 'Chantier 003',
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
        }],
      });

      await prisma.decision_strategique.createMany({
        data: [{
          id: 'e7369826-7d9a-4ea0-8f70-a888c86df6da',
          chantier_id: 'CH-001',
          date: new Date('2023-03-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision la plus recente',
          auteur_id: null,
        }, {
          id: '731c4017-eab3-419a-874a-b19171045e62',
          chantier_id: 'CH-001',
          date: new Date('2023-01-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision moins recente',
          auteur_id: null,
        }, {
          id: '1a8803f8-d045-42b7-9c99-8062f2c0d124',
          chantier_id: 'CH-001',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision la plus ancienne',
          auteur_id: null,
        }, {
          id: '80a0cd7b-f2e1-4262-8c59-93f24baefb70',
          chantier_id: 'CH-003',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision sans auteur id',
          auteur_id: null,
        }, {
          id: '8a045044-a04f-4447-a4d2-5cc81685684b',
          chantier_id: 'CH-004',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision avec auteur id',
          auteur_id: auteur_id,
        }],
      });

      // When
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);

      // Then
      expect(résultat).toStrictEqual({
        id: 'e7369826-7d9a-4ea0-8f70-a888c86df6da',
        type: 'suiviDesDécisionsStratégiques',
        auteur: 'Auteur Inconnu',
        contenu: 'Contenu décision la plus recente',
        date: new Date('2023-03-30').toISOString(),
      });
    });

    it('Lorsque l\'auteur id est null, retourne Auteur Inconnu', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Lasne',
          prenom: 'Paul',
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
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
      });

      await prisma.decision_strategique.createMany({
        data: [{
          id: '80a0cd7b-f2e1-4262-8c59-93f24baefb70',
          chantier_id: 'CH-003',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision sans auteur id',
          auteur_id: null,
        }],
      });

      // When
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente('CH-003');

      // Then
      expect(résultat).toStrictEqual({
        id: '80a0cd7b-f2e1-4262-8c59-93f24baefb70',
        type: 'suiviDesDécisionsStratégiques',
        auteur: 'Auteur Inconnu',
        contenu: 'Contenu décision sans auteur id',
        date: new Date('2022-09-30').toISOString(),
      });
    });

    it('Lorsque l\'auteur id est non null, retourne prenom + nom de l\'utilisateur associé', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Marveaux',
          prenom: 'Sylvain',
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
          id: 'CH-004',
          nom: 'Chantier 004',
        }],
      });

      await prisma.decision_strategique.createMany({
        data: [{
          id: '8a045044-a04f-4447-a4d2-5cc81685684b',
          chantier_id: 'CH-004',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision avec auteur id',
          auteur_id: auteur_id,
        }],
      });

      // When
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente('CH-004');

      // Then
      expect(résultat).toStrictEqual({
        id: '8a045044-a04f-4447-a4d2-5cc81685684b',
        type: 'suiviDesDécisionsStratégiques',
        auteur: 'Sylvain Marveaux',
        contenu: 'Contenu décision avec auteur id',
        date: new Date('2022-09-30').toISOString(),
      });
    });
  });

  describe('RécupérerLHistorique', () => {
    it("Retourne toutes les publications de décisions stratégiques pour un chantier, dans l'ordre décroissant", async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Lasne',
          prenom: 'Paul',
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
          id: 'CH-003',
          nom: 'Chantier 003',
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
        }],
      });

      await prisma.decision_strategique.createMany({
        data: [{
          id: 'e7369826-7d9a-4ea0-8f70-a888c86df6da',
          chantier_id: 'CH-001',
          date: new Date('2023-03-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision la plus recente',
          auteur_id: null,
        }, {
          id: '731c4017-eab3-419a-874a-b19171045e62',
          chantier_id: 'CH-001',
          date: new Date('2023-01-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision moins recente',
          auteur_id: null,
        }, {
          id: '1a8803f8-d045-42b7-9c99-8062f2c0d124',
          chantier_id: 'CH-001',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision la plus ancienne',
          auteur_id: null,
        }, {
          id: '80a0cd7b-f2e1-4262-8c59-93f24baefb70',
          chantier_id: 'CH-003',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision sans auteur id',
          auteur_id: null,
        }, {
          id: '8a045044-a04f-4447-a4d2-5cc81685684b',
          chantier_id: 'CH-004',
          date: new Date('2022-09-30'),
          type: 'suivi_des_decisions',
          contenu: 'Contenu décision avec auteur id',
          auteur_id: auteur_id,
        }],
      });

      // When
      const résultat = await décisionStratégiqueRepository.récupérerHistorique(chantierId);

      // Then
      expect(résultat[0]?.date).toStrictEqual(new Date('2023-03-30').toISOString());
      expect(résultat[1]?.date).toStrictEqual(new Date('2023-01-30').toISOString());
      expect(résultat[2]?.date).toStrictEqual(new Date('2022-09-30').toISOString());
    });
  });

  describe('créer', () => {
    // Given
    const id = '123';
    const contenu = 'Décision importante';
    const type = 'suiviDesDécisionsStratégiques';
    const date = new Date('2023-04-14');

    it('Crée la décision stratégique en base', async () => {
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
      await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur_id, date);

      // Then
      const décisionStratégiqueCrééeEnBase = await prisma.decision_strategique.findUnique({ where: { id: id } });
      expect(décisionStratégiqueCrééeEnBase?.id).toEqual(id);
    });

    it('Retourne la décision stratégique créée', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Z',
          prenom: 'Jay',
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
      const décisionStratégiqueCrééeRetournéeParLeRepo = await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur_id, date);

      // Then
      expect(décisionStratégiqueCrééeRetournéeParLeRepo).toStrictEqual({
        id,
        type,
        contenu,
        auteur: 'Jay Z',
        date: date.toISOString(),
      });
    });
  });
  describe('#anonymiserAuteurs', () => {
    test('doit anonymiser l\'auteur des décisions stratégiques saisies par l\'utilisateur supprimé', async () => {
      // Given
      const auteurId1 = 'f62765e6-0d66-4cfa-af41-6ec9b3ded48c';
      const auteurId2 = '3150e759-3551-4ff7-9ba1-c8e119f49f3b';
      const auteurId3 = '4421e6d7-980b-4ea9-ab66-95d4c2b62a6c';

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });

      await prisma.utilisateur.createMany({
        data: [
          {
            id: auteurId1,
            email: 'john.doe@test.com',
            nom: 'doe',
            prenom: 'john',
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            id: auteurId2,
            email: 'auteur.commentaire@test.com',
            nom: 'commentaire',
            prenom: 'auteur',
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            id: auteurId3,
            email: 'auteur.inconnu@modernisation.gouv.fr',
            nom: 'inconnu',
            prenom: 'auteur',
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },          
        ],
      });

      await prisma.decision_strategique.createMany({
        data: [
          {
            id: '77053976-1a8e-49f0-b68a-df01da2fc277',
            chantier_id: 'CH-001',
            auteur_id: auteurId1,
            contenu: '',
            type: 'suivi_des_decisions',
            date: new Date('2023-05-01'),
          },
          {
            id: 'b699907e-43c4-43be-8d8d-185fca1b2e50',
            chantier_id: 'CH-001',
            auteur_id: auteurId2,
            contenu: '',
            type: 'suivi_des_decisions',
            date: new Date('2024-05-01'),
          },
          {
            id: 'e3885e40-caab-4fb6-acf4-0c8f66c9e290',
            chantier_id: 'CH-001',
            auteur_id: auteurId2,
            contenu: '',
            type: 'suivi_des_decisions',
            date: new Date('2023-05-01'),
          },
        ],
      });

      // When
      await décisionStratégiqueRepository.anonymiserAuteurs([auteurId2], 'auteur.inconnu@modernisation.gouv.fr');

      // Then
      const decisionsAvecAuteurAnonyme = await prisma.decision_strategique.findMany({ where: { auteur_id: auteurId3 } });
      expect(decisionsAvecAuteurAnonyme).toHaveLength(2);
      expect(decisionsAvecAuteurAnonyme[0].id).toStrictEqual('b699907e-43c4-43be-8d8d-185fca1b2e50');
      expect(decisionsAvecAuteurAnonyme[1].id).toStrictEqual('e3885e40-caab-4fb6-acf4-0c8f66c9e290');
    });
  });
});
