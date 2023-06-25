import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  PrismaErreurValidationFichierRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaErreurValidationFichierRepository';
import { ErreurValidationFichierBuilder } from '@/server/import-indicateur/app/builder/ErreurValidationFichier.builder';

describe('PrismaErreurValidationFichierRepository', () => {
  let prismaRapportRepository: PrismaRapportRepository;
  let prismaErreurValidationFichierRepository: PrismaErreurValidationFichierRepository;

  beforeEach(() => {
    prismaRapportRepository = new PrismaRapportRepository(prisma);
    prismaErreurValidationFichierRepository = new PrismaErreurValidationFichierRepository(prisma);
  });

  describe('#sauvegarder', () => {
    it('doit sauvegarder les données', async () => {
      // GIVEN
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur, 'test');

      const rapport = new DetailValidationFichierBuilder()
        .avecId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      await prismaRapportRepository.sauvegarder(rapport);

      const listeErreursValidationFichier = [
        new ErreurValidationFichierBuilder()
          .avecId('c196301f-f370-42d1-add8-9c0a6d7562af')
          .avecRapportId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
          .avecCellule('None')
          .avecMessage("Un indicateur ne peut etre vide. C'est le cas à la ligne 2")
          .avecNom('Cellule vide')
          .avecNomDuChamp('indic_id')
          .avecNumeroDeLigne(1)
          .avecPositionDeLigne(1)
          .avecPositionDuChamp(1)
          .build(),
        new ErreurValidationFichierBuilder()
          .avecId('254dcc8e-cb4c-4ea9-b4f8-3f0e59bf1acd')
          .avecRapportId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
          .avecCellule('IND-02')
          .avecMessage('Indicateur invalide')
          .avecNom('METRIC_INVALIDE')
          .avecNomDuChamp('indic_id')
          .avecNumeroDeLigne(2)
          .avecPositionDeLigne(2)
          .avecPositionDuChamp(2)
          .build(),
      ];

      // WHEN
      await prismaErreurValidationFichierRepository.sauvegarder(listeErreursValidationFichier);

      // THEN
      const resultListeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();

      expect(resultListeErreursValidationFichier).toHaveLength(2);

      expect(resultListeErreursValidationFichier[0].id).toBeDefined();
      expect(resultListeErreursValidationFichier[0].rapport_id).toEqual('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad');
      expect(resultListeErreursValidationFichier[0].nom).toEqual('Cellule vide');
      expect(resultListeErreursValidationFichier[0].cellule).toEqual('None');
      expect(resultListeErreursValidationFichier[0].message).toEqual("Un indicateur ne peut etre vide. C'est le cas à la ligne 2");
      expect(resultListeErreursValidationFichier[0].nom_du_champ).toEqual('indic_id');
      expect(resultListeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
      expect(resultListeErreursValidationFichier[0].position_de_ligne).toEqual(1);
      expect(resultListeErreursValidationFichier[0].position_du_champ).toEqual(1);

      expect(resultListeErreursValidationFichier[1].id).toBeDefined();
      expect(resultListeErreursValidationFichier[1].rapport_id).toEqual('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad');
      expect(resultListeErreursValidationFichier[1].nom).toEqual('METRIC_INVALIDE');
      expect(resultListeErreursValidationFichier[1].cellule).toEqual('IND-02');
      expect(resultListeErreursValidationFichier[1].message).toEqual('Indicateur invalide');
      expect(resultListeErreursValidationFichier[1].nom_du_champ).toEqual('indic_id');
      expect(resultListeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
      expect(resultListeErreursValidationFichier[1].position_de_ligne).toEqual(2);
      expect(resultListeErreursValidationFichier[1].position_du_champ).toEqual(2);
    });
  });
});
