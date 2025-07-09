import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { prisma } from '@/server/db/prisma';
import { PrismaDecisionStrategiqueRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaDecisionStrategiqueRepository';

describe('PrismaDecisionStrategiqueRepository', () => {
  let prismaDecisionStrategiqueRepository: PrismaDecisionStrategiqueRepository;

  beforeEach(() => {
    prismaDecisionStrategiqueRepository = new PrismaDecisionStrategiqueRepository();
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
            email: 'utilisateur.supprime@modernisation.gouv.fr',
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
      await prismaDecisionStrategiqueRepository.anonymiserAuteurs([auteurId2], 'utilisateur.supprime@modernisation.gouv.fr');

      // Then
      const decisionsAvecAuteurAnonyme = await prisma.decision_strategique.findMany({ where: { auteur_id: auteurId3 } });
      expect(decisionsAvecAuteurAnonyme).toHaveLength(2);
      expect(decisionsAvecAuteurAnonyme[0].id).toStrictEqual('b699907e-43c4-43be-8d8d-185fca1b2e50');
      expect(decisionsAvecAuteurAnonyme[1].id).toStrictEqual('e3885e40-caab-4fb6-acf4-0c8f66c9e290');
    });
  });
});
