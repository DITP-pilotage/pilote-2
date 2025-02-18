import { prisma } from '@/server/db/prisma';
import { PrismaPropositionValeurActuelleRepository } from './PrismaPropositionValeurActuelleRepository';

describe('PrismaPropositionValeurActuelle', () => {
  let prismaPropositionValeurActuelleRepository: PrismaPropositionValeurActuelleRepository;

  beforeEach(() => {
    prismaPropositionValeurActuelleRepository = new PrismaPropositionValeurActuelleRepository();
  });

  describe('#supprimerPropositionsValeurActuelleApresImport', () => {
    it('si la date de valeur actuelle associée à la proposition est égale à la date donnée, doit appliquer le statut SUPPRIME pour l\'id indicateur et la zone demandée', async () => {
      // GIVEN
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
          statut: 'EN COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.supprimerPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2024-12-01'),
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual('SUPPRIME');
    });
    it('si la date de valeur actuelle associée à la proposition est inférieure à la date donnée, doit appliquer le statut SUPPRIME pour l\'id indicateur et la zone demandée', async () => {
      // GIVEN
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
          statut: 'EN COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.supprimerPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2025-01-01'),
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual('SUPPRIME');
    });
    it('si la date de valeur actuelle associée à la proposition est supérieure à la date donnée, ne doit pas modifier le statut pour l\'id indicateur et la zone demandée', async () => {
      // GIVEN
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
          statut: 'EN COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.supprimerPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2024-01-01'),
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual('EN COURS');
    });
    it('si l\'indicateur ne correspond pas à l\'id, ne modifie pas le statut', async () => {
      // GIVEN
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
          statut: 'EN COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.supprimerPropositionsValeurActuelleApresImport({
        indicId: 'IND-002', 
        zoneId: 'D34', 
        dateValeurImportee: new Date('2025-01-01'),
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual('EN COURS');
    });
    it('si le territoire ne correspond pas à celui demandé, ne modifie pas le statut', async () => {
      // GIVEN
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
          statut: 'EN COURS',
        },
      });
      // WHEN
      await prismaPropositionValeurActuelleRepository.supprimerPropositionsValeurActuelleApresImport({
        indicId: 'IND-001', 
        zoneId: 'D35', 
        dateValeurImportee: new Date('2025-01-01'),
      });

      // THEN
      const proposition = await prisma.proposition_valeur_actuelle.findFirst();
      expect(proposition?.statut).toStrictEqual('EN COURS');
    });
  });  
});
