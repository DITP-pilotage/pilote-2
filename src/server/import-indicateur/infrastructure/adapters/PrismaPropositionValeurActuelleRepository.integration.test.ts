import { prisma } from '@/server/db/prisma';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { PrismaPropositionValeurActuelleRepository } from './PrismaPropositionValeurActuelleRepository';

describe('PrismaPropositionValeurActuelle', () => {
  let prismaPropositionValeurActuelleRepository: PrismaPropositionValeurActuelleRepository;

  beforeEach(() => {
    prismaPropositionValeurActuelleRepository = new PrismaPropositionValeurActuelleRepository();
  });

  describe('#modifierStatutPropositionsValeurActuelleApresImport', () => {
    it("si la date de valeur actuelle de l'import est égale à la date de valeur actuelle de la proposition et la valeur actuelle importée est égale à la proposition, applique le statut ACCEPTEE_VIA_IMPORT", async () => {
      // GIVEN
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
      
      await prisma.proposition_valeur_actuelle.create({
        data: {
          id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
          date_valeur_actuelle: new Date('2024-12-01'),
          date_proposition: new Date(),
          valeur_actuelle_proposee: 10,
          auteur_modification: 'auteur',
          id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
          motif_proposition: 'motif',
          source_donnee_methode_calcul: 'source',
          statut: 'EN_COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2024-12-01'),
        valeurImportee: 10,
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual(StatutProposition.ACCEPTEE_VIA_IMPORT);
    }); 
    it("si la date de valeur actuelle de l'import est égale à la date de valeur actuelle de la proposition et la valeur actuelle importée est différente la proposition, applique le statut TRAITEE_VIA_IMPORT", async () => {
      // GIVEN
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
      
      await prisma.proposition_valeur_actuelle.create({
        data: {
          id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
          date_valeur_actuelle: new Date('2024-12-01'),
          date_proposition: new Date(),
          valeur_actuelle_proposee: 10,
          auteur_modification: 'auteur',
          id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
          motif_proposition: 'motif',
          source_donnee_methode_calcul: 'source',
          statut: 'EN_COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2024-12-01'),
        valeurImportee: 12,
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual(StatutProposition.TRAITEE_VIA_IMPORT);      
    }); 
    it("si la date de valeur actuelle de l'import est postérieure à la date de valeur actuelle de la proposition, applique le statut IGNOREE_VIA_IMPORT", async () => {
      // GIVEN
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

      await prisma.proposition_valeur_actuelle.create({
        data: {
          id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
          date_valeur_actuelle: new Date('2024-12-01'),
          date_proposition: new Date(),
          valeur_actuelle_proposee: 10,
          auteur_modification: 'auteur',
          id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
          motif_proposition: 'motif',
          source_donnee_methode_calcul: 'source',
          statut: 'EN_COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2025-12-01'),
        valeurImportee: 10,
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual(StatutProposition.IGNOREE_VIA_IMPORT);
    });
    it("si la date de valeur actuelle de l'import est antérieure à la date de valeur actuelle de la proposition, ne modifie pas le statut", async () => {
      // GIVEN
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

      await prisma.proposition_valeur_actuelle.create({
        data: {
          id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
          date_valeur_actuelle: new Date('2024-12-01'),
          date_proposition: new Date(),
          valeur_actuelle_proposee: 10,
          auteur_modification: 'auteur',
          id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
          motif_proposition: 'motif',
          source_donnee_methode_calcul: 'source',
          statut: 'EN_COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2023-12-01'),
        valeurImportee: 10,
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual(StatutProposition.EN_COURS);
    });
    it("si le statut de la proposition n'est pas EN_COURS, ne modifie pas le statut", async () => {
      // GIVEN
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

      await prisma.proposition_valeur_actuelle.create({
        data: {
          id: '4cba3d15-fdc2-4d7c-b614-f0a009d5126e',
          indic_id: 'IND-001',
          territoire_code: 'DEPT-34',
          date_valeur_actuelle: new Date('2024-12-01'),
          date_proposition: new Date(),
          valeur_actuelle_proposee: 10,
          auteur_modification: 'auteur',
          id_auteur_modification: '7d9ba603-d510-46f6-bda3-736210467521',
          motif_proposition: 'motif',
          source_donnee_methode_calcul: 'source',
          statut: 'IGNOREE_VIA_IMPORT',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2024-12-01'),
        valeurImportee: 10,
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual(StatutProposition.IGNOREE_VIA_IMPORT);
    }); 
  });
});
