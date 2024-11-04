import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import CommentaireRepository from '@/server/domain/chantier/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES,
} from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('CommentaireSQLRepository', () => {
  describe('récupérerLePlusRécent', () => {
    it('Retourne null quand pas de commentaire de ce type en base pour ce chantier', async () => {
      // GIVEN
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      // WHEN
      const résultat = await commentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'autresRésultatsObtenus');

      // THEN
      expect(résultat).toStrictEqual(null);
    });

    it('quand l\'id auteur est null, l\'auteur est égal à Auteur Inconnu ', async () => {
      // GIVEN
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);
      const commentaire = new CommentaireSQLRowBuilder()
        .avecChantierId('CH-001')
        .avecAuteurId(null)
        .avecMaille('NAT')
        .avecCodeInsee('FR')
        .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
        .avecDate(new Date('2023-04-20'))
        .build();
      await prisma.commentaire.create({ data: commentaire });

      // WHEN
      const résultat = await commentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'risquesEtFreinsÀLever');

      // THEN
      expect(résultat?.auteur).toStrictEqual('Auteur Inconnu');
    });

    it('quand l\'id auteur est non null, l\'auteur retourné est égal au prénom + nom de l\'utilisateur associé à l\'id', async () => {
      // GIVEN
      const auteur_id = randomUUID();
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);
      const commentaire = new CommentaireSQLRowBuilder()
        .avecChantierId('CH-001')
        .avecAuteurId(auteur_id)
        .avecMaille('NAT')
        .avecCodeInsee('FR')
        .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
        .avecDate(new Date('2023-04-20'))
        .build();
        
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
      await prisma.commentaire.create({ data: commentaire });

      // WHEN
      const résultat = await commentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'risquesEtFreinsÀLever');

      // THEN
      expect(résultat?.auteur).toStrictEqual('Paul Lasne');
    });

    it('Retourne le commentaire le plus récent pour un type et un chantier', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      const commentaireRisqueEtFreinsÀLeverLePlusRécent = new CommentaireSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
        .avecDate(new Date('2023-04-20'))
        .build();

      const commentaireRisqueEtFreinsÀLeverMoinsRécent = new CommentaireSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
        .avecDate(new Date('2022-12-31'))
        .build();

      const commentaireSolutionsEtActionsÀVenir = new CommentaireSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
        .avecDate(new Date('2023-04-21'))
        .build();

      const commentaires: Prisma.commentaireCreateArgs['data'][] = [commentaireSolutionsEtActionsÀVenir, commentaireRisqueEtFreinsÀLeverLePlusRécent, commentaireRisqueEtFreinsÀLeverMoinsRécent];

      await prisma.commentaire.createMany({ data: commentaires });

      // WHEN
      const résultat = await commentaireRepository.récupérerLePlusRécent(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, 'risquesEtFreinsÀLever');

      // THEN
      expect(résultat).toStrictEqual({
        id: commentaireRisqueEtFreinsÀLeverLePlusRécent.id,
        contenu: commentaireRisqueEtFreinsÀLeverLePlusRécent.contenu,
        date: (commentaireRisqueEtFreinsÀLeverLePlusRécent.date).toISOString(),
        auteur: 'Auteur Inconnu',
        type: NOMS_TYPES_COMMENTAIRES[commentaireRisqueEtFreinsÀLeverLePlusRécent.type],
      });
    });
  });

  describe('récupérerHistoriqueDUnCommentaire', () => {
    test('Retourne, par ordre antéchronologique, tous les commentaires du type donné pour un chantier et un territoire', async () => {
      // GIVEN
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const typeCommentaire: TypeCommentaireChantier = 'risquesEtFreinsÀLever';
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      const commentaires: Prisma.commentaireCreateArgs['data'][]  = [
        new CommentaireSQLRowBuilder()
          .avecId('12345')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
          .avecContenu('Mon commentaire frein FR 2022')
          .avecDate(new Date('2022-12-31'))
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('1235')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
          .avecContenu('Mon commentaire frein FR 2023')
          .avecDate(new Date('2023-12-31'))
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('1234')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
          .avecContenu('Mon commentaire action')
          .avecDate(new Date('2023-12-30'))
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('145')
          .avecChantierId(chantierId)
          .avecMaille('départementale')
          .avecCodeInsee('01')
          .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
          .avecContenu('Mon commentaire frein département 2023')
          .avecDate(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.commentaire.createMany({ data: commentaires });

      // WHEN
      const result = await commentaireRepository.récupérerHistorique(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, typeCommentaire);

      // THEN
      expect(result).toStrictEqual([
        {
          id: '1235',
          type: 'risquesEtFreinsÀLever',
          auteur: 'Auteur Inconnu',
          contenu: 'Mon commentaire frein FR 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, 
        {
          id: '12345',
          type: 'risquesEtFreinsÀLever',
          auteur: 'Auteur Inconnu',
          contenu: 'Mon commentaire frein FR 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('créer', () => {

    test('Crée le commentaire en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const id = '123';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const type = 'risquesEtFreinsÀLever';
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

      const commentaireRepository = new CommentaireSQLRepository(prisma);

      // When
      await commentaireRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur_id, type, date);

      // Then
      const commentaireCrééeEnBase = await prisma.commentaire.findUnique({ where: { id: id } });
      expect(commentaireCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le commentaire créé', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const id = '123';
      const contenu = 'Quatrième commentaire';
      const date = '2023-12-31T00:00:00.000Z';
      const type = 'risquesEtFreinsÀLever';
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

      const commentaireRepository = new CommentaireSQLRepository(prisma);

      // When
      const commentaireCréée = await commentaireRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur_id, type, new Date(date));

      // Then
      expect(commentaireCréée).toStrictEqual({
        contenu,
        auteur: 'Doe John',
        date,
        id,
        type,
      });
    });
  });
});
