import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { prisma } from '@/server/db/prisma';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';
import UtilisateurRepository from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository.interface';
import { UtilisateurSQLRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/UtilisateurSQLRepository';

describe('UtilisateurSQLRepository', () => {
  let utilisateurRepository: UtilisateurRepository;

  beforeEach(() => {
    utilisateurRepository = new UtilisateurSQLRepository();
  });

  describe('récupérerNombreUtilisateursSurLeTerritoire', function () {

    test("retourne le nombre d'utilisateurs régionaux pour une région donnée", async () => {
      // Given
      const randomUtilisateur = {
        nom: '',
        prenom: '',
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
            profilCode: ProfilEnum.PREFET_DEPARTEMENT,
          },
          {
            ...randomUtilisateur, 
            email: 'responsable_ara@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
          },
          {
            ...randomUtilisateur, 
            email: 'sd_occ@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
          },
          {
            ...randomUtilisateur, 
            email: 'ditp_admin@test.com',
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            ...randomUtilisateur, 
            email: 'sd_herault@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
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
      const nombreProfilHerault = await utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire('DEPT-34', 'departementale');
      const nombreProfilAra = await utilisateurRepository.récupérerNombreUtilisateursSurLeTerritoire('REG-84', 'regionale');
      
      // Then
      expect(nombreProfilHerault).toStrictEqual(2);
      expect(nombreProfilAra).toStrictEqual(1);

    });
  });

  describe('récupérerNombreUtilisateursParTerritoires', function () {

    test("retourne les nombres d'utilisateurs pour une liste de territoires", async () => {
      // Given
      const territoires = [
        new TerritoireBuilder().avecCode('DEPT-34').avecMaille('departementale').build(),
        new TerritoireBuilder().avecCode('DEPT-75').avecMaille('departementale').build(),
        new TerritoireBuilder().avecCode('REG-84').avecMaille('regionale').build(),
      ];

      const randomUtilisateur = {
        nom: '',
        prenom: '',
        date_creation: new Date().toISOString(),
      };

      const habilitationsTerritoires: Record<string, string[]> = {
        'prefet_herault@test.com': ['DEPT-34'],
        'responsable_ara@test.com': ['REG-84', 'DEPT-69'],
        'sd_occ@test.com': ['REG-76', 'DEPT-34'],
        'sd_herault@test.com': ['DEPT-34'],
        'ditp_admin@test.com': ['REG-84'],
        'compte_desactive_herault@test.com': ['DEPT-34'],
      };

      await prisma.utilisateur.createMany({
        data: [
          {
            ...randomUtilisateur, 
            email: 'prefet_herault@test.com',
            profilCode: ProfilEnum.PREFET_DEPARTEMENT,
          },
          {
            ...randomUtilisateur, 
            email: 'compte_desactive_herault@test.com',
            profilCode: ProfilEnum.PREFET_DEPARTEMENT,
            date_desactivation: new Date(),
          },
          {
            ...randomUtilisateur, 
            email: 'responsable_ara@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
          },
          {
            ...randomUtilisateur, 
            email: 'sd_occ@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
          },
          {
            ...randomUtilisateur, 
            email: 'ditp_admin@test.com',
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            ...randomUtilisateur, 
            email: 'sd_herault@test.com',
            profilCode: ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
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

  describe('desactiver', function () {
    const utilisateurACreer = {
      nom: 'test',
      prenom: 'test',
      date_creation: new Date().toISOString(),
      email: 'utilisateuracreer@test.com',
      profilCode: ProfilEnum.DITP_ADMIN,
    };

    test('Si l\'email n\'exsite pas, ne fait rien', async () => {
      await prisma.utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.desactiver('utilisateurinexistant@test.com');
      const utilisateurNonExistant = await prisma.utilisateur.findFirst({ 
        where: {
          email: 'utilisateurinexistant@test.com',
        },
      });
      const utilisateurExistant = await prisma.utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurNonExistant).toBeNull();
      expect(utilisateurExistant?.date_desactivation).toBeNull();
    });
    test('Si l\'email exsite, mets à jour la date de desactivation', async () => {
      await prisma.utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.desactiver('utilisateuracreer@test.com');
      const utilisateurDesactive = await prisma.utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurDesactive).not.toBeNull();
      expect(utilisateurDesactive?.date_desactivation).not.toBeNull();
    });
  });
  describe('reactiver', function () {
    const dateDesactivation = new Date();
    const utilisateurACreer = {
      nom: 'test',
      prenom: 'test',
      date_creation: new Date().toISOString(),
      email: 'utilisateuracreer@test.com',
      profilCode: ProfilEnum.DITP_ADMIN,
      date_desactivation: dateDesactivation,
    };

    test('Si l\'email n\'exsite pas, ne fait rien', async () => {
      await prisma.utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.reactiver('utilisateurinexistant@test.com');
      const utilisateurNonExistant = await prisma.utilisateur.findFirst({ 
        where: {
          email: 'utilisateurinexistant@test.com',
        },
      });
      const utilisateurExistant = await prisma.utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurNonExistant).toBeNull();
      expect(utilisateurExistant?.date_desactivation).toStrictEqual(dateDesactivation);
    });
    test('Si l\'email exsite, mets la date de desactivation à null', async () => {
      await prisma.utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.reactiver('utilisateuracreer@test.com');
      const utilisateurDesactive = await prisma.utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurDesactive).not.toBeNull();
      expect(utilisateurDesactive?.date_desactivation).toBeNull();
    });

  });
});
