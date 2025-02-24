import { randomUUID } from 'node:crypto';
import {
  SynthèseDesRésultatsSQLRepository,
} from '@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/db/prisma';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  let  synthèseDesRésultatsRepository: SynthèseDesRésultatsSQLRepository;

  beforeEach(() => {
    synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository();
  });

  describe('créer', () => {
    test('Crée la synthèse des résultats en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const id = '123';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const météo = 'SOLEIL';
      const auteur_id = randomUUID();

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
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
      await synthèseDesRésultatsRepository.créer(chantierId, 'REG-01', id, contenu, auteur_id, météo, date);

      // Then
      const synthèseDesRésultatsCrééeEnBase = await prisma.synthese_des_resultats.findUnique({ where: { id: id } });
      expect(synthèseDesRésultatsCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne la synthèse de résultats créée', async () => {
      // Given
      const chantierId = 'CH-001';
      const id =  '123';
      const contenu = 'Quatrième commentaire';
      const date =  '2023-12-31T00:00:00.000Z';
      const météo = 'SOLEIL';
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

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }],
      });

      // When
      const synthèseDesRésultatsCréée = await synthèseDesRésultatsRepository.créer(chantierId, 'REG-01', id, contenu, auteur_id, météo, new Date(date));

      // Then
      expect(synthèseDesRésultatsCréée).toStrictEqual({
        contenu,
        auteur: 'Doe John',
        date,
        id,
        météo,
      });
    });
  });

  describe('findNewestByChantierIdAndTerritoire', () => {
    test('Renvoie null si aucune synthèse des résultats n\'est présente en base', async () => {
      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente('CH-001', 'DEPT-01');

      // Then
      expect(result).toBeNull();
    });

    test('renvoie la synthèse des résultats la plus récente et dont le commentaire est non null', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }],
      });

      await prisma.synthese_des_resultats.createMany({
        data: [{
          id: '129b2f20-fc6b-4343-bdf1-435aa8966878',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          territoire_code: 'REG-01',
          commentaire: 'Premier commentaire',
          date_commentaire: null,
        }, {
          id: 'f0c511e8-b9e3-4918-83c9-4b073cb0af75',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          territoire_code: 'REG-01',
          commentaire: null,
          date_commentaire: new Date('2023-01-01'),
        }, {
          id: '813d079e-b5f1-422b-ade1-49d9db4941d9',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          territoire_code: 'REG-01',
          commentaire: 'Troisième commentaire',
          date_commentaire: new Date('2023-01-01'),
        }, {
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Quatrième commentaire',
          date_commentaire: new Date('2023-12-31'),
        }],
      });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente('CH-001', 'REG-01');

      // Then
      expect(result).toStrictEqual({
        id: '85567357-8805-4de0-bb53-b20202f675f8',
        météo: 'SOLEIL',
        contenu: 'Quatrième commentaire',
        date: '2023-12-31T00:00:00.000Z',
        auteur: 'Auteur Inconnu',
      });
    });

    test("Quand l'auteur_id est null, retourne Auteur Inconnu", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }],
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          auteur_id: null,
          territoire_code: 'REG-01',
          commentaire: 'Premier commentaire',
          date_commentaire: new Date('2023-12-31'),
        },
      });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente('CH-001', 'REG-01');
      
      // Then
      expect(result?.auteur).toStrictEqual('Auteur Inconnu');
    });

    test("Quand l'auteur_id est non null, retourne prenom + nom de l'utilisateur associé", async () => {
      // Given
      const auteur_id = randomUUID();

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
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

      await prisma.synthese_des_resultats.create({
        data: {
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          auteur_id,
          territoire_code: 'REG-01',
          commentaire: 'Premier commentaire',
          date_commentaire: new Date('2023-12-31'),
        },
      });
      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente('CH-001', 'REG-01');

      // Then
      expect(result?.auteur).toStrictEqual('Doe John');
    });

  });

  describe('récupérerHistoriqueDeLaSynthèseDesRésultats', () => {
    test('Retourne, par ordre antéchronologique, toutes les synthèses des résultats pour un chantier et un territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }],
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }],
      });

      await prisma.synthese_des_resultats.createMany({
        data: [{
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2022',
          date_commentaire: new Date('2022-12-31'),
        }, {
          id: '9e101e9e-55e2-42e5-a20f-3d746bf6be33',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2023',
          date_commentaire: new Date('2023-12-31'),
        }, {
          id: '11926bad-2987-4626-90bc-a251df39271f',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-01',
          commentaire: 'Ma synthèse DEPT-01',
          date_commentaire: new Date('2023-12-31'),
        }],
      });

      // When
      const résultat = await synthèseDesRésultatsRepository.récupérerHistorique('CH-001', 'REG-01');

      // Then
      expect(résultat).toStrictEqual([
        {
          id: '9e101e9e-55e2-42e5-a20f-3d746bf6be33',
          météo: 'SOLEIL',
          auteur: 'Auteur Inconnu',
          contenu: 'Ma synthèse REG-01 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          météo: 'SOLEIL',
          auteur: 'Auteur Inconnu',
          contenu: 'Ma synthèse REG-01 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('récupérerLesPlusRécentesGroupéesParChantier', () => {
    test('retourne les objectifs les plus récent groupé par chantier', async () => {
      // Given
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
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-002',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'REG',
          zone_id: 'R01',
          territoire_code: 'REG-01',
        }, {
          id: 'CH-003',
          code_insee: '01',
          maille: 'DEPT',
          zone_id: 'D01',
          territoire_code: 'DEPT-01',
        }],
      });

      await prisma.synthese_des_resultats.createMany({
        data: [{
          id: '85567357-8805-4de0-bb53-b20202f675f8',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2022',
          date_commentaire: new Date('2022-12-31'),
        }, {
          id: '9e101e9e-55e2-42e5-a20f-3d746bf6be33',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2023',
          date_commentaire: new Date('2023-12-31'),
        }, {
          id: '11926bad-2987-4626-90bc-a251df39271f',
          chantier_id: 'CH-001',
          code_insee: '01',
          maille: 'DEPT',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-01',
          commentaire: 'Ma synthèse DEPT-01',
          date_commentaire: new Date('2023-12-31'),
        }, {
          id: 'cb416fb2-38c3-4771-8065-efca4dd9b8f9',
          chantier_id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2022',
          date_commentaire: new Date('2022-12-31'),
        }, {
          id: '8f8792f3-c7d7-48d7-a54a-ecb4c956cadc',
          chantier_id: 'CH-002',
          code_insee: '01',
          maille: 'REG',
          meteo: 'ORAGE',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2023 ch2',
          date_commentaire: new Date('2023-12-31'),
        }, {
          id: 'dc006e87-ce1c-40ad-b127-1fab80b3899e',
          chantier_id: 'CH-003',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2022',
          date_commentaire: new Date('2022-12-31'),
        }, {
          id: '5b031409-d693-40fc-a717-7c2eea3e51fd',
          chantier_id: 'CH-003',
          code_insee: '01',
          maille: 'REG',
          meteo: 'SOLEIL',
          territoire_code: 'REG-01',
          commentaire: 'Ma synthèse REG-01 2023',
          date_commentaire: new Date('2023-12-31'),
        }],
      });

      // When
      const résultat = await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(['CH-001', 'CH-002'], 'regionale', '01');

      // Then
      expect(résultat).toStrictEqual({
        'CH-001': {
          id: '9e101e9e-55e2-42e5-a20f-3d746bf6be33',
          auteur: 'Auteur Inconnu',
          contenu: 'Ma synthèse REG-01 2023',
          date: '2023-12-31T00:00:00.000Z',
          météo: 'SOLEIL',
        },
        'CH-002': {
          id: '8f8792f3-c7d7-48d7-a54a-ecb4c956cadc',
          auteur: 'Auteur Inconnu',
          contenu: 'Ma synthèse REG-01 2023 ch2',
          date: '2023-12-31T00:00:00.000Z',
          météo: 'ORAGE',
        },
      });
    });
  });
});
