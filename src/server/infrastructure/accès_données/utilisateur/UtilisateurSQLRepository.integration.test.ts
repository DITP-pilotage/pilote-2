import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { UtilisateurSQLRepository } from './UtilisateurSQLRepository';

describe('UtilisateurSQLRepository', () => {
  let utilisateurRepository: UtilisateurRepository;

  beforeEach(() => {
    utilisateurRepository = new UtilisateurSQLRepository(prisma);
  });

  describe('récupérerNombreUtilisateursSurLeTerritoire', function () {

    test("retourne le nombre d'utilisateurs régionaux pour une région donnée", async () => {
      // Given
      const randomUtilisateur = {
        nom: '',
        prenom: '',
        auteur_modification: '',
        auteur_creation: '',
        date_creation: new Date().toISOString(),
      };

      const habilitationsTerritoires: Record<string, string[]> = {
        'prefet_herault@test.com': ['DEPT-34'],
        'coordinateur_ara@test.com': ['REG-84', 'DEPT-69'],
        'sd_occ@test.com': ['REG-76', 'DEPT-34'],
        'sd_herault@test.com': ['DEPT-34'],
        'ditp_admin@test.com': ['REG-84'],
      };

      await prisma.utilisateur.createMany({
        data: [
          {
            ...randomUtilisateur, 
            email: 'prefet_herault@test.com',
            profilCode: 'PREFET_DEPARTEMENT',
          },
          {
            ...randomUtilisateur, 
            email: 'coordinateur_ara@test.com',
            profilCode: 'COORDINATEUR_REGION',
          },
          {
            ...randomUtilisateur, 
            email: 'sd_occ@test.com',
            profilCode: 'SERVICES_DECONCENTRES_REGION',
          },
          {
            ...randomUtilisateur, 
            email: 'ditp_admin@test.com',
            profilCode: 'DITP_ADMIN',
          },
          {
            ...randomUtilisateur, 
            email: 'sd_herault@test.com',
            profilCode: 'SERVICES_DECONCENTRES_DEPARTEMENT',
          },
        ],
      });

      const utilisateursCréés = await prisma.utilisateur.findMany({});

      const DonnéesHabilitations = utilisateursCréés.map((utilisateur) => ({
        utilisateurId: utilisateur.id,
        scopeCode: 'lecture',
        territoires: habilitationsTerritoires[utilisateur.email],
        perimetres: [],
        chantiers: [],
      }));

      await prisma.habilitation.createMany({
        data: DonnéesHabilitations,
      });

      // When
      const nombreProfilHerault = await utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire('DEPT-34', 'départementale');
      const nombreProfilAra = await utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire('REG-84', 'régionale');
      
      // Then
      expect(nombreProfilHerault).toStrictEqual(2);
      expect(nombreProfilAra).toStrictEqual(1);

    });
  });
});
