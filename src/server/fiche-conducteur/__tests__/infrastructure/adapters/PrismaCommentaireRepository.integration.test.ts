import { randomUUID } from 'node:crypto';
import {
  PrismaCommentaireRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaCommentaireRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

describe('PrismaCommentaireRepository', () => {
  let prisma: PrismaPilote;
  let prismaCommentaireRepository: PrismaCommentaireRepository;

  beforeEach(() => {
    prisma = new PrismaPilote();
    prismaCommentaireRepository = new PrismaCommentaireRepository({ prisma });
  });

  describe('#listerObjectifParChantierId', () => {
    it('doit lister les commentaires associé au chantier', async () => {
      // Given
      const chantierId = 'CH-168';
      await prisma.getInstance().chantier_identite.createMany({ data: [{
        id: 'CH-168',
        nom: 'Nom chantier OK',
      }, {
        id: 'CH-169',
        nom: 'Nom chantier OK',
      }],
      });

      await prisma.getInstance().chantier_territoire.createMany({ data: [{
        id: 'CH-168',
        zone_id: 'FRANCE',
        maille: 'NAT',
        code_insee: 'FR',
        territoire_code: 'NAT-FR',
      }, {
        id: 'CH-169',
        zone_id: 'FRANCE',
        maille: 'NAT',
        code_insee: 'FR',
        territoire_code: 'NAT-FR',
      }],
      });

      await prisma.getInstance().commentaire.createMany({
        data: [
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'freins_a_lever',
            contenu: 'contenu OK freins_a_lever',
            auteur_id: null,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'actions_a_venir',
            contenu: 'contenu OK actions_a_venir',
            auteur_id: null,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-169',
            type: 'actions_a_venir',
            contenu: 'contenu KO chantier_id',
            auteur_id: null,
            date: new Date(),
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
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
