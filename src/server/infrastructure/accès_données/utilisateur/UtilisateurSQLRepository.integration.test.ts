import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { UtilisateurSQLRepository } from './UtilisateurSQLRepository';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';

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
        'responsable_ara@test.com': ['REG-84', 'DEPT-69'],
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
            email: 'responsable_ara@test.com',
            profilCode: 'RESPONSABLE_REGION',
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

  describe('récupérerNombreUtilisateursSurLeTerritoire', function () {

    test("retourne les nombres d'utilisateurs pour une liste de territoires", async () => {
      // Given
      const territoires = [
        new TerritoireBuilder().avecCode('DEPT-34').avecMaille('départementale').build(),
        new TerritoireBuilder().avecCode('DEPT-75').avecMaille('départementale').build(),
        new TerritoireBuilder().avecCode('REG-84').avecMaille('régionale').build(),
      ];

      const randomUtilisateur = {
        nom: '',
        prenom: '',
        auteur_modification: '',
        auteur_creation: '',
        date_creation: new Date().toISOString(),
      };

      const habilitationsTerritoires: Record<string, string[]> = {
        'prefet_herault@test.com': ['DEPT-34'],
        'responsable_ara@test.com': ['REG-84', 'DEPT-69'],
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
            email: 'responsable_ara@test.com',
            profilCode: 'RESPONSABLE_REGION',
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
      const nombresUtilisateurs = await utilisateurRepository.récupérerNombreUtilisateursParTerritoires(territoires);
      
      // Then
      expect(nombresUtilisateurs).toStrictEqual({
        'DEPT-34': 2,
        'REG-84': 1,
        'DEPT-75': 0,
      });

    });
  });
});


