import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaCommentaireRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaCommentaireRepository';

describe('PrismaCommentaireRepository', () => {
  let prismaCommentaireRepository: PrismaCommentaireRepository;
  const auteur_id = randomUUID();

  beforeEach(async () => {
    prismaCommentaireRepository = new PrismaCommentaireRepository(prisma);
    await prisma.utilisateur.create({
      data: {
        id: auteur_id,
        email: '',
        nom: '', 
        prenom: '',
        date_creation: new Date(),
        profil: {
          connect: {
            code: 'DITP_ADMIN',
          },
        },
      },
    });
  });

  describe('#listerObjectifParChantierId', () => {
    it('doit lister les commentaires associé au chantier', async () => {
      // Given
      const chantierId = 'CH-168';
      await prisma.chantier.createMany({ data: [{
        id: 'CH-168',
        nom: 'Nom chantier OK',
        code_insee: 'FR',
        maille: 'NAT',
        territoire_code: 'NAT-FR',
      }, {
        id: 'CH-169',
        nom: 'Nom chantier OK',
        code_insee: 'FR',
        maille: 'NAT',
        territoire_code: 'NAT-FR',
      }],
      });

      await prisma.commentaire.createMany({
        data: [
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'freins_a_lever',
            contenu: 'contenu OK freins_a_lever',
            auteur_id: auteur_id,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'actions_a_venir',
            contenu: 'contenu OK actions_a_venir',
            auteur_id: auteur_id,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-169',
            type: 'actions_a_venir',
            contenu: 'contenu KO chantier_id',
            auteur_id: auteur_id,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
          },
        ],
      });
      // When
      const listeCommentaireResult = await prismaCommentaireRepository.listerCommentaireParChantierId({ chantierId });
      // Then
      expect(listeCommentaireResult.map(commentaire => commentaire.type)).toIncludeSameMembers(['freins_a_lever', 'actions_a_venir']);
      expect(listeCommentaireResult.map(commentaire => commentaire.contenu)).toIncludeSameMembers(['contenu OK freins_a_lever', 'contenu OK actions_a_venir']);
    });
  });
});
