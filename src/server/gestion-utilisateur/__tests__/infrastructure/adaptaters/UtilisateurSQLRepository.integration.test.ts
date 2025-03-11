import { ProfilEnum } from '@/server/app/enum/profil.enum';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { PrismaUtilisateurRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

describe('PrismaUtilisateurRepository', () => {
  let utilisateurRepository: UtilisateurRepository;
  let prisma: PrismaPilote;

  beforeEach(() => {
    prisma = new PrismaPilote();
    utilisateurRepository = new PrismaUtilisateurRepository({ prisma });
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

      await prisma.getInstance().utilisateur.createMany({
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

      const utilisateursCréés = await prisma.getInstance().utilisateur.findMany({});

      const DonnéesHabilitations = utilisateursCréés.map((utilisateur) => ({
        utilisateurId: utilisateur.id,
        scopeCode: 'lecture',
        territoires: habilitationsTerritoires[utilisateur.email],
        perimetres: [],
        chantiers: [],
      }));

      await prisma.getInstance().habilitation.createMany({
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
      date_modification: new Date('2024-01-01'),
    };

    test("Si l'email n'existe pas, ne fait rien", async () => {
      await prisma.getInstance().utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.desactiver('utilisateurinexistant@test.com');
      const utilisateurNonExistant = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateurinexistant@test.com',
        },
      });
      const utilisateurExistant = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurNonExistant).toBeNull();
      expect(utilisateurExistant?.date_desactivation).toBeNull();
    });
    test("Si l'email existe, mets à jour la date de desactivation et la date de dernière modification", async () => {
      await prisma.getInstance().utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.desactiver('utilisateuracreer@test.com');
      const utilisateurDesactive = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurDesactive).not.toBeNull();
      expect(utilisateurDesactive?.date_desactivation).not.toBeNull();
      expect(utilisateurDesactive?.date_modification.toDateString()).toStrictEqual(new Date().toDateString());
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
      date_modification: new Date('2024-01-01'),
    };

    test("Si l'email n'existe pas, ne fait rien", async () => {
      await prisma.getInstance().utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.reactiver('utilisateurinexistant@test.com');
      const utilisateurNonExistant = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateurinexistant@test.com',
        },
      });
      const utilisateurExistant = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurNonExistant).toBeNull();
      expect(utilisateurExistant?.date_desactivation).toStrictEqual(dateDesactivation);
    });
    test("Si l'email existe, mets la date de desactivation à null et modifie la date de dernière modification", async () => {
      await prisma.getInstance().utilisateur.create({
        data: utilisateurACreer,
      });

      await utilisateurRepository.reactiver('utilisateuracreer@test.com');
      const utilisateurDesactive = await prisma.getInstance().utilisateur.findFirst({
        where: {
          email: 'utilisateuracreer@test.com',
        },
      });

      expect(utilisateurDesactive).not.toBeNull();
      expect(utilisateurDesactive?.date_desactivation).toBeNull();
      expect(utilisateurDesactive?.date_modification.toDateString()).toStrictEqual(new Date().toDateString());
    });

  });
});
