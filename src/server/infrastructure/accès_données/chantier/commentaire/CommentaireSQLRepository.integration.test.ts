import { randomUUID } from 'node:crypto';
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES,
} from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

describe('CommentaireSQLRepository', () => {
  let prismaCommentaireRepository: CommentaireSQLRepository;

  beforeEach(() => {
    prismaCommentaireRepository = new CommentaireSQLRepository(prisma);
  });

  describe('#récupérerLePlusRécent', () => {
    it('Retourne null quand pas de commentaire de ce type en base pour ce chantier', async () => {
      // When
      const résultat = await prismaCommentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'autresRésultatsObtenus');

      // Then
      expect(résultat).toStrictEqual(null);
    });

    it("quand l'id auteur est null, l'auteur est égal à Auteur Inconnu ", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
        },
      });

      await prisma.commentaire.create({
        data: {
          id: 'd4a6b497-58c9-4f5b-8288-6dc66cfc81c4',
          chantier_id: 'CH-001',
          auteur_id: null,
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2023-04-20'),
          contenu: 'commentaire risquesEtFreinsÀLever',
        },
      });

      // When
      const résultat = await prismaCommentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'risquesEtFreinsÀLever');

      // Then
      expect(résultat?.auteur).toStrictEqual('Auteur Inconnu');
    });

    it("quand l'id auteur est non null, l'auteur retourné est égal au prénom + nom de l'utilisateur associé à l'id", async () => {
      // Given
      const auteur_id = 'f62765e6-0d66-4cfa-af41-6ec9b3ded48c';

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
        },
      });

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

      await prisma.commentaire.create({
        data: {
          id: 'd4a6b497-58c9-4f5b-8288-6dc66cfc81c4',
          chantier_id: 'CH-001',
          auteur_id: auteur_id,
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2023-04-20'),
          contenu: 'commentaire risquesEtFreinsÀLever',
        },
      });

      // When
      const résultat = await prismaCommentaireRepository.récupérerLePlusRécent('CH-001', 'NAT-FR', 'risquesEtFreinsÀLever');

      // Then
      expect(résultat?.auteur).toStrictEqual('Paul Lasne');
    });

    it('Retourne le commentaire le plus récent pour un type et un chantier', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
        },
      });

      await prisma.commentaire.createMany({
        data: [{
          id: 'b0b6dc3f-1e61-4864-a637-162d70c42699',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2023-04-20'),
          contenu: 'contenu commentaire risquesEtFreinsÀLever 1',
          auteur: 'John doe',
        }, {
          id: '05948d49-bd6f-468a-a241-f5f42524aab4',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2022-12-31'),
          contenu: 'contenu commentaire risquesEtFreinsÀLever 2',
          auteur: 'Jane doe',
        }, {
          id: '24c06783-9588-42e8-97e5-27a4cbddfd2f',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'],
          date: new Date('2023-04-21'),
          contenu: 'contenu commentaire solutionsEtActionsÀVenir',
          auteur: 'Jack doe',
        }],
      });

      // When
      const résultat = await prismaCommentaireRepository.récupérerLePlusRécent(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, 'risquesEtFreinsÀLever');

      // Then
      expect(résultat).toStrictEqual({
        id: 'b0b6dc3f-1e61-4864-a637-162d70c42699',
        contenu: 'contenu commentaire risquesEtFreinsÀLever 1',
        date: new Date('2023-04-20').toISOString(),
        auteur: 'Auteur Inconnu',
        type: 'risquesEtFreinsÀLever',
      });
    });
  });

  describe('#récupérerHistorique', () => {
    test('Retourne, par ordre antéchronologique, tous les commentaires du type donné pour un chantier et un territoire', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'nationale';
      const codeInsee = 'FR';
      const typeCommentaire: TypeCommentaireChantier = 'risquesEtFreinsÀLever';

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
        }, {
          id: 'CH-001',
          zone_id: 'D01',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
        }],
      });

      await prisma.commentaire.createMany({
        data: [{
          id: 'b0b6dc3f-1e61-4864-a637-162d70c42699',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2022-12-31'),
          contenu: 'Mon commentaire frein FR 2022',
        }, {
          id: '05948d49-bd6f-468a-a241-f5f42524aab4',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2023-12-31'),
          contenu: 'Mon commentaire frein FR 2023',
        }, {
          id: '24c06783-9588-42e8-97e5-27a4cbddfd2f',
          chantier_id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
          territoire_code: `${CODES_MAILLES[maille]}-${codeInsee}`,
          type: CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'],
          date: new Date('2023-12-30'),
          contenu: 'Mon commentaire action',
        }, {
          id: 'd5f66616-6679-4cca-a449-290b3076ab3e',
          chantier_id: chantierId,
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          type: CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
          date: new Date('2023-12-31'),
          contenu: 'Mon commentaire frein département 2023',
        }],
      });

      // When
      const result = await prismaCommentaireRepository.récupérerHistorique(chantierId, `${CODES_MAILLES[maille]}-${codeInsee}`, typeCommentaire);

      // Then
      expect(result).toStrictEqual([
        {
          id: '05948d49-bd6f-468a-a241-f5f42524aab4',
          type: 'risquesEtFreinsÀLever',
          auteur: 'Auteur Inconnu',
          contenu: 'Mon commentaire frein FR 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, 
        {
          id: 'b0b6dc3f-1e61-4864-a637-162d70c42699',
          type: 'risquesEtFreinsÀLever',
          auteur: 'Auteur Inconnu',
          contenu: 'Mon commentaire frein FR 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('#créer', () => {
    test('Crée le commentaire en base', async () => {
      // Given
      const chantierId = 'CH-001';
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

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'R01',
          maille: 'REG',
          code_insee: '01',
          territoire_code: 'REG-01',
        }],
      });

      // When
      await prismaCommentaireRepository.créer(chantierId, 'REG-01', id, contenu, auteur_id, type, date);

      // Then
      const commentaireCrééeEnBase = await prisma.commentaire.findUnique({ where: { id: id } });

      expect(commentaireCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le commentaire créé', async () => {
      // Given
      const chantierId = 'CH-001';
      const id = '2267cd4b-f656-4dcd-ae61-81c4608b5b4c';
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

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });
      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'R01',
          maille: 'REG',
          code_insee: '01',
          territoire_code: 'REG-01',
        }],
      });

      // When
      const commentaireCréée = await prismaCommentaireRepository.créer(chantierId, 'REG-01', id, contenu, auteur_id, type, new Date(date));

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

  describe('#récupérerLesPlusRécentsGroupésParChantier', () => {
    // pour l'instant testé dans RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase ....
  });
});
