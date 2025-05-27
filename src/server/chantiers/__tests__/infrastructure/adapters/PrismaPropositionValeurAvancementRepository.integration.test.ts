import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { prisma } from '@/server/db/prisma';
import { PropositionValeurAvancementBuilder } from '@/server/chantiers/app/builder/PropositionValeurAvancementBuilder';
import {
  PrismaPropositionValeurAvancementRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurAvancementRepository';

describe('PrismaPropositionValeurAvancementRepository', () => {
  let prismaPropositionValeurAvancementRepository: PrismaPropositionValeurAvancementRepository;

  beforeEach(() => {
    prismaPropositionValeurAvancementRepository = new PrismaPropositionValeurAvancementRepository();
  });

  describe('#supprimerPropositionValeurAvancement', () => {
    it('doit appliquer le statut RETIREE à la proposition de valeur avancement avec le statut EN_COURS', async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          id: '7d9ba603-d510-46f6-bda3-736210467521',
          nom: 'auteur',
          email: 'auteur@example.com',
          prenom: 'Prénom',
          date_creation: new Date(),
          profilCode: 'DITP_ADMIN',
        },
      });
      await prisma.proposition_valeur_actuelle.createMany({
        data: [
          {
            id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
            indic_id: 'IND-001',
            territoire_code: 'DEPT-34',
            date_valeur_actuelle: new Date('2024-12-01'),
            date_proposition: new Date('2025-01-01'),
            valeur_actuelle_proposee: 10,
            id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
            motif_proposition: 'motif',
            source_donnee_methode_calcul: 'source',
            statut: StatutProposition.EN_COURS,
          },
          {
            id: '1f690d37-6c39-4f9c-ae98-283f66fd6574',
            indic_id: 'IND-001',
            territoire_code: 'DEPT-34',
            date_valeur_actuelle: new Date('2024-12-01'),
            date_proposition: new Date('2025-02-01'),
            valeur_actuelle_proposee: 8,
            id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
            motif_proposition: 'motif',
            source_donnee_methode_calcul: 'source',
            statut: StatutProposition.ACCEPTEE_VIA_IMPORT,           
          },
        ],
      });

      // When
      await prismaPropositionValeurAvancementRepository.supprimerPropositionValeurAvancement({
        indicId: 'IND-001',
        territoireCode: 'DEPT-34',
      });

      // Then
      const propositions = await prisma.proposition_valeur_actuelle.findMany({
        where: {
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
        },
        orderBy: {
          date_proposition: 'asc',
        },
      });
      expect(propositions).toHaveLength(2);
      expect(propositions[0].statut).toStrictEqual(StatutProposition.RETIREE);
      expect(propositions[1].statut).toStrictEqual(StatutProposition.ACCEPTEE_VIA_IMPORT);

    });
  });

  describe('#annulePropositionValeurAvancementPrecedente', () => {
    it('doit appliquer le statut ANNULEE à la proposition de valeur avancement avec le statut EN_COURS', async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          id: '7d9ba603-d510-46f6-bda3-736210467521',
          nom: 'auteur',
          email: 'auteur@example.com',
          prenom: 'Prénom',
          date_creation: new Date(),
          profilCode: 'DITP_ADMIN',
        },
      });
      await prisma.proposition_valeur_actuelle.createMany({
        data: [
          {
            id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
            indic_id: 'IND-001',
            territoire_code: 'DEPT-34',
            date_valeur_actuelle: new Date('2024-12-01'),
            date_proposition: new Date('2025-01-01'),
            valeur_actuelle_proposee: 10,
            id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
            motif_proposition: 'motif',
            source_donnee_methode_calcul: 'source',
            statut: StatutProposition.EN_COURS,
          },
          {
            id: '1f690d37-6c39-4f9c-ae98-283f66fd6574',
            indic_id: 'IND-001',
            territoire_code: 'DEPT-34',
            date_valeur_actuelle: new Date('2024-12-01'),
            date_proposition: new Date('2025-02-01'),
            valeur_actuelle_proposee: 8,
            id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
            motif_proposition: 'motif',
            source_donnee_methode_calcul: 'source',
            statut: StatutProposition.ACCEPTEE_VIA_IMPORT,           
          },
        ],
      });

      // When
      await prismaPropositionValeurAvancementRepository.annulePropositionValeurAvancementPrecedente({
        indicId: 'IND-001',
        territoireCode: 'DEPT-34',
      });

      // Then
      const propositions = await prisma.proposition_valeur_actuelle.findMany({
        where: {
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
        },
        orderBy: {
          date_proposition: 'asc',
        },
      });
      expect(propositions).toHaveLength(2);
      expect(propositions[0].statut).toStrictEqual(StatutProposition.ANNULEE);
      expect(propositions[1].statut).toStrictEqual(StatutProposition.ACCEPTEE_VIA_IMPORT);

    });
  });

  describe('#creerPropositionValeurAvancement', () => {
    it('doit creer la proposition de valeur avancement', async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          id: '7d9ba603-d510-46f6-bda3-736210467521',
          nom: 'auteur',
          email: 'auteur@example.com',
          prenom: 'Prénom',
          date_creation: new Date(),
          profilCode: 'DITP_ADMIN',
        },
      });
      const propositionValeurAvancement = new PropositionValeurAvancementBuilder()
        .avecId('c2afe41e-51df-493a-b140-b9380c625197')
        .avecIndicId('IND-002')
        .avecValeurAvancementProposee(23.2)
        .avecTerritoireCode('DEPT-87')
        .avecDateValeurAvancement(new Date('2024-03-13'))
        .avecIdAuteurModification('7d9ba603-d510-46f6-bda3-736210467521')
        .avecAuteurModification('jane.doe@test.com')
        .avecDateProposition(new Date('2024-05-13'))
        .avecMotifProposition('Un motif excellent')
        .avecSourceDonneeEtMethodeCalcul('Une source encore mieux')
        .avecStatut(StatutProposition.EN_COURS)
        .build();
      // When
      await prismaPropositionValeurAvancementRepository.creerPropositionValeurAvancement(propositionValeurAvancement);
      // Then
      const propositionValeurAvancementCree = await prisma.proposition_valeur_actuelle.findFirst({
        where: {
          id: 'c2afe41e-51df-493a-b140-b9380c625197',
        },
      });
  
      expect(propositionValeurAvancementCree).toBeDefined();
    });
  });
});
