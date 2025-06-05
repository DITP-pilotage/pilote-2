import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { prisma } from '@/server/db/prisma';
import { PropositionValeurActuelleBuilder } from '@/server/chantiers/app/builder/PropositionValeurActuelleBuilder';
import {
  PrismaPropositionValeurActuelleRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurActuelleRepository';

describe('PrismaPropositionValeurActuelleRepository', () => {
  let prismaPropositionValeurActuelleRepository: PrismaPropositionValeurActuelleRepository;

  beforeEach(async () => {
    prismaPropositionValeurActuelleRepository = new PrismaPropositionValeurActuelleRepository();
    await prisma.chantier_identite.create({
      data: {
        id: 'CH-001',
        nom: 'Chantier 001',
      },
    });
    await prisma.chantier_territoire.createMany({
      data: [
        {
          id: 'CH-001',
          territoire_code: 'DEPT-34',
          code_insee: '34',
          maille: 'DEPT',
          zone_id: 'D34',
        },
      ],
    });
    await prisma.indicateur_identite.createMany({
      data: [
        {
          id: 'IND-001',
          nom: 'indicateur 1',
          chantier_id: 'CH-001',
        },
      ],
    });
    await prisma.indicateur_territoire.createMany({
      data: [
        {
          id: 'IND-001',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          territoire_code: 'DEPT-34',
          code_insee: '34',
          zone_id: 'D34',
        },
      ],
    });
  });
  describe('#supprimerPropositionValeurActuelle', () => {
    it('doit appliquer le statut RETIREE à la proposition de valeur actuelle avec le statut EN_COURS', async () => {
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
      await prismaPropositionValeurActuelleRepository.supprimerPropositionValeurActuelle({
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

  describe('#annulePropositionValeurActuellePrecedente', () => {
    it('doit appliquer le statut ANNULEE à la proposition de valeur actuelle avec le statut EN_COURS', async () => {
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
      await prismaPropositionValeurActuelleRepository.annulePropositionValeurActuellePrecedente({
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

  describe('#creerPropositionValeurActuelle', () => {
    it('doit creer la proposition de valeur actuelle', async () => {
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
      const propositionValeurActuelle = new PropositionValeurActuelleBuilder()
        .avecId('c2afe41e-51df-493a-b140-b9380c625197')
        .avecIndicId('IND-001')
        .avecValeurActuelleProposee(23.2)
        .avecTerritoireCode('DEPT-34')
        .avecDateValeurActuelle(new Date('2024-03-13'))
        .avecIdAuteurModification('7d9ba603-d510-46f6-bda3-736210467521')
        .avecAuteurModification('jane.doe@test.com')
        .avecDateProposition(new Date('2024-05-13'))
        .avecMotifProposition('Un motif excellent')
        .avecSourceDonneeEtMethodeCalcul('Une source encore mieux')
        .avecStatut(StatutProposition.EN_COURS)
        .build();
      // When
      await prismaPropositionValeurActuelleRepository.creerPropositionValeurActuelle(propositionValeurActuelle);
      // Then
      const propositionValeurActuelleCree = await prisma.proposition_valeur_actuelle.findFirst({
        where: {
          id: 'c2afe41e-51df-493a-b140-b9380c625197',
        },
      });
  
      expect(propositionValeurActuelleCree).toBeDefined();
    });
  });
});
