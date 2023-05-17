import { Prisma } from '@prisma/client';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES,
} from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';

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
        auteur: commentaireRisqueEtFreinsÀLeverLePlusRécent.auteur,
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
      const typeCommentaire: TypeCommentaire = 'risquesEtFreinsÀLever';
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
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('1235')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
          .avecContenu('Mon commentaire frein FR 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('1234')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecType(CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'])
          .avecContenu('Mon commentaire action')
          .avecDate(new Date('2023-12-30'))
          .avecAuteur('Jean Nemar')
          .build(),

        new CommentaireSQLRowBuilder()
          .avecId('145')
          .avecChantierId(chantierId)
          .avecMaille('départementale')
          .avecCodeInsee('01')
          .avecType(CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'])
          .avecContenu('Mon commentaire frein département 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
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
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire frein FR 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, 
        {
          id: '12345',
          type: 'risquesEtFreinsÀLever',
          auteur: 'Jean Bon',
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
      const auteur = 'Jean DUPONT';
      const type = 'risquesEtFreinsÀLever';

      const commentaireRepository = new CommentaireSQLRepository(prisma);

      // When
      await commentaireRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur, type, date);

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
      const auteur = 'Jean DUPONT';
      const type = 'risquesEtFreinsÀLever';

      const commentaireRepository = new CommentaireSQLRepository(prisma);

      // When
      const commentaireCréée = await commentaireRepository.créer(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, id, contenu, auteur, type, new Date(date));

      // Then
      expect(commentaireCréée).toStrictEqual({
        contenu,
        auteur,
        date,
        id,
        type,
      });
    });
  });
});
