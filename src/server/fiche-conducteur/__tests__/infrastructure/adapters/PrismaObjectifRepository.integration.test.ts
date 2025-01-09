import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaObjectifRepository } from '@/server/fiche-conducteur/infrastructure/adapters/PrismaObjectifRepository';

describe('PrismaObjectifRepository', () => {
  let prismaObjectifRepository: PrismaObjectifRepository;
  const auteur_id = randomUUID();

  beforeEach(async () => {
    prismaObjectifRepository = new PrismaObjectifRepository(prisma);
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
    it('doit lister les objectifs associé au chantier', async () => {
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

      await prisma.objectif.createMany({
        data: [
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'deja_fait',
            contenu: 'contenu OK deja_fait',
            auteur_id: auteur_id,
            date: new Date(),
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'notre_ambition',
            contenu: 'contenu OK notre_ambition',
            auteur_id: auteur_id,
            date: new Date(),
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'a_faire',
            contenu: 'contenu OK a_faire',
            auteur_id: auteur_id,
            date: new Date(),
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-169',
            type: 'notre_ambition',
            contenu: 'contenu KO chantier_id',
            auteur_id: auteur_id,
            date: new Date(),
          },
        ],
      });
      // When
      const listeObjectifsResult = await prismaObjectifRepository.listerObjectifParChantierId({ chantierId });
      // Then
      expect(listeObjectifsResult.map(objectif => objectif.type)).toIncludeSameMembers(['deja_fait', 'a_faire', 'notre_ambition']);
      expect(listeObjectifsResult.map(objectif => objectif.contenu)).toIncludeSameMembers(['contenu OK deja_fait', 'contenu OK a_faire', 'contenu OK notre_ambition']);
    });
  });
});
