import { synthese_des_resultats } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import SynthèseDesRésultatsSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('créer', () => {
    test('Crée la synthèse des résultats en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'regionale';
      const codeInsee = '01';
      const id = '123';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const météo = 'SOLEIL';
      const auteur_id = randomUUID();

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
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
      await synthèseDesRésultatsRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur_id, météo, date);

      // Then
      const synthèseDesRésultatsCrééeEnBase = await prisma.synthese_des_resultats.findUnique({ where: { id: id } });
      expect(synthèseDesRésultatsCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne la synthèse de résultats créée', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'regionale';
      const codeInsee = '01';
      const id =  '123';
      const contenu = 'Quatrième commentaire';
      const date =  '2023-12-31T00:00:00.000Z';
      const météo = 'SOLEIL';
      const auteur_id = randomUUID();

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
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
      const synthèseDesRésultatsCréée = await synthèseDesRésultatsRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur_id, météo, new Date(date));

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
      // Given
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente('CH-001', 'DEPT-01');

      // Then
      expect(result).toBeNull();
    });

    test('renvoie la synthèse des résultats la plus récente et dont le commentaire est non nul', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'regionale';
      const codeInsee = '01';
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
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

      const synthesesDesResultats: synthese_des_resultats[] = [
        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Premier commentaire')
          .avecDateCommentaire(null)
          .avecAuteurId(auteur_id)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire(null)
          .avecDateCommentaire(new Date('2023-01-01'))
          .avecAuteurId(auteur_id)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Troisième commentaire')
          .avecDateCommentaire(new Date('2023-01-01'))
          .avecAuteurId(auteur_id)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecId('aaa-aaa')
          .avecMétéo('SOLEIL')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Quatrième commentaire')
          .avecDateCommentaire(new Date('2023-12-31'))
          .avecAuteurId(auteur_id)
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthesesDesResultats });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`);

      // Then
      expect(result).toStrictEqual({
        id: 'aaa-aaa',
        météo: 'SOLEIL',
        contenu: 'Quatrième commentaire',
        date: '2023-12-31T00:00:00.000Z',
        auteur: 'Doe John',
      });
    });
    test('retourne prenom + nom de l\'utilisateur associé', async () => {
      // Given
      const chantierId = 'CH-003';
      const maille: Maille = 'regionale';
      const codeInsee = '01';
      const auteur_id = randomUUID();
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
  
      const synthesesDesResultats = new SynthèseDesRésultatsSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecAuteurId(auteur_id)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecCommentaire('Premier commentaire')
        .avecDateCommentaire(new Date('2023-12-31'))
        .build();

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

      await prisma.synthese_des_resultats.create({ data: synthesesDesResultats });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`);
      
      // Then
      expect(result?.auteur).toStrictEqual('Doe John');
    });

  });

  describe('récupérerHistoriqueDeLaSynthèseDesRésultats', () => {
    test('Retourne, par ordre antéchronologique, toutes les synthèses des résultats pour un chantier et un territoire', async () => {
      // GIVEN
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
      const chantierId = 'CH-001';
      const maille: Maille = 'regionale';
      const codeInsee = '01';
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

      const synthèsesDesResultats: synthese_des_resultats[] = [
        new SynthèseDesRésultatsSQLRowBuilder()
          .avecId('aaaa-aab')
          .avecMétéo('SOLEIL')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Ma synthèse REG-01 2022')
          .avecDateCommentaire(new Date('2022-12-31'))
          .avecAuteurId(auteur_id)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecId('aaaa-aaa')
          .avecMétéo('SOLEIL')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Ma synthèse REG-01 2023')
          .avecDateCommentaire(new Date('2023-12-31'))
          .avecAuteurId(auteur_id)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille('departementale')
          .avecCodeInsee('88')
          .avecCommentaire('Ma synthèse DEPT-88')
          .avecDateCommentaire(new Date('2023-12-31'))
          .avecAuteurId(auteur_id)
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthèsesDesResultats });

      // WHEN
      const résultat = await synthèseDesRésultatsRepository.récupérerHistorique(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`);

      // THEN
      expect(résultat).toStrictEqual([
        {
          id: 'aaaa-aaa',
          météo: 'SOLEIL',
          auteur: 'Doe John',
          contenu: 'Ma synthèse REG-01 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          id: 'aaaa-aab',
          météo: 'SOLEIL',
          auteur: 'Doe John',
          contenu: 'Ma synthèse REG-01 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });
});
