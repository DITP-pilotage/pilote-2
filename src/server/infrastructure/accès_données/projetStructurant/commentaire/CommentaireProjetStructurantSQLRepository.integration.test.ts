import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { TypeCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import CommentaireProjetStructurantRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireProjetStructurantSQLRow.builder';
import CommentaireProjetStructurantSQLRepository, { CODES_TYPES_COMMENTAIRES } from './CommentaireProjetStructurantSQLRepository';

describe('CommentaireSQLRepository', () => {
  describe('créer', () => {
    test('Crée le commentaire en base', async () => {
      // Given
      const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
      const id = '7a33ee55-b74c-4464-892b-b2b7fdc3bc58';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const type = 'partenariatsEtMoyensMobilisés';

      const commentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);

      // When
      await commentaireProjetStructurantRepository.créer(projetStructurantId, id, contenu, auteur, type, date);

      // Then
      const commentaireCrééeEnBase = await prisma.commentaire_projet_structurant.findUnique({ where: { id: id } });
      expect(commentaireCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le commentaire créé', async () => {
      // Given
      const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
      const id = '7a33ee55-b74c-4464-892b-b2b7fdc3bc58';
      const contenu = 'Quatrième commentaire';
      const date = '2023-12-31T00:00:00.000Z';
      const auteur = 'Jean DUPONT';
      const type = 'partenariatsEtMoyensMobilisés';

      const commentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);

      // When
      const commentaireCréée = await commentaireProjetStructurantRepository.créer(projetStructurantId, id, contenu, auteur, type, new Date(date));

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

  describe('récupérerHistoriqueDUnCommentaire', () => {
    test('Retourne, par ordre antéchronologique, tous les commentaires du type donné pour un chantier et un territoire', async () => {
      // GIVEN
      const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
      const typeCommentaire: TypeCommentaireProjetStructurant = 'partenariatsEtMoyensMobilisés';
      const commentaireRepository: CommentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);

      const commentaires  = [
        new CommentaireProjetStructurantRowBuilder()
          .avecId('660f4eb8-6c94-42d2-b95e-c93d29365320')
          .avecProjetStructurantId(projetStructurantId)
          .avecType(CODES_TYPES_COMMENTAIRES['partenariatsEtMoyensMobilisés'])
          .avecContenu('Mon commentaire frein FR 2022')
          .avecDate(new Date('2022-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireProjetStructurantRowBuilder()
          .avecId('e4911d6d-5616-4d0d-9f59-549b95a1f088')
          .avecProjetStructurantId(projetStructurantId)
          .avecType(CODES_TYPES_COMMENTAIRES['partenariatsEtMoyensMobilisés'])
          .avecContenu('Mon commentaire frein FR 2023')
          .avecDate(new Date('2023-12-31'))
          .avecAuteur('Jean Bon')
          .build(),

        new CommentaireProjetStructurantRowBuilder()
          .avecId('3ed69b70-8823-4743-ab9c-05143c6a6882')
          .avecProjetStructurantId(projetStructurantId)
          .avecType(CODES_TYPES_COMMENTAIRES['partenariatsEtMoyensMobilisés'])
          .avecContenu('Mon commentaire 2023 2')
          .avecDate(new Date('2023-12-30'))
          .avecAuteur('Jean Nemar')
          .build(),

      ];

      await prisma.commentaire_projet_structurant.createMany({ data: commentaires });

      // WHEN
      const result = await commentaireRepository.récupérerHistorique(projetStructurantId, typeCommentaire);

      // THEN
      expect(result).toStrictEqual([
        {
          id: 'e4911d6d-5616-4d0d-9f59-549b95a1f088',
          type: 'partenariatsEtMoyensMobilisés',
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire frein FR 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, 
        {
          id: '3ed69b70-8823-4743-ab9c-05143c6a6882',
          type: 'partenariatsEtMoyensMobilisés',
          auteur: 'Jean Nemar',
          contenu: 'Mon commentaire 2023 2',
          date: '2023-12-30T00:00:00.000Z',
        }, 
        {
          id: '660f4eb8-6c94-42d2-b95e-c93d29365320',
          type: 'partenariatsEtMoyensMobilisés',
          auteur: 'Jean Bon',
          contenu: 'Mon commentaire frein FR 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });
});
