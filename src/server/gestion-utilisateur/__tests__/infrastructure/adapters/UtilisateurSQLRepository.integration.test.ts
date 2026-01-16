import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import TerritoireBuilder from "@/server/domain/territoire/Territoire.builder";

describe("PrismaUtilisateurRepository", () => {
  const prisma = new PrismaPilote();
  let repository: PrismaUtilisateurRepository;

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma });
  });

  describe("récupérerNombreUtilisateursParTerritoires", function () {
    it(
      "retourne les nombres d'utilisateurs pour une liste de territoires",
      createIntegrationTest(async () => {
        // Given

        const territoires = [
          new TerritoireBuilder()
            .avecCode("DEPT-34")
            .avecMaille("departementale")
            .build(),
          new TerritoireBuilder()
            .avecCode("DEPT-75")
            .avecMaille("departementale")
            .build(),
          new TerritoireBuilder()
            .avecCode("REG-84")
            .avecMaille("regionale")
            .build(),
        ];

        const prefetHerault = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
        });
        const compteDesactiveHerault = await fixtures.utilisateur({
          profilCode: ProfilEnum.PREFET_DEPARTEMENT,
          date_desactivation: new Date(),
        });
        const responsableAra = await fixtures.utilisateur({
          profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
        });
        const sdOcc = await fixtures.utilisateur({
          profilCode: ProfilEnum.SERVICES_DECONCENTRES_REGION,
        });
        const ditpAdmin = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const sdHerault = await fixtures.utilisateur({
          profilCode: ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        });

        await fixtures.habilitation({
          utilisateurId: prefetHerault.id,
          territoires: ["DEPT-34"],
        });
        await fixtures.habilitation({
          utilisateurId: compteDesactiveHerault.id,
          territoires: ["DEPT-34"],
        });
        await fixtures.habilitation({
          utilisateurId: responsableAra.id,
          territoires: ["REG-84", "DEPT-69"],
        });
        await fixtures.habilitation({
          utilisateurId: sdOcc.id,
          territoires: ["REG-76", "DEPT-34"],
        });
        await fixtures.habilitation({
          utilisateurId: ditpAdmin.id,
          territoires: ["REG-84"],
        });
        await fixtures.habilitation({
          utilisateurId: sdHerault.id,
          territoires: ["DEPT-34"],
        });

        // When
        const nombresUtilisateurs =
          await repository.récupérerNombreUtilisateursParTerritoires(
            territoires,
          );

        // Then
        expect(nombresUtilisateurs).toStrictEqual({
          "DEPT-34": 2,
          "REG-84": 1,
          "DEPT-75": 0,
        });
      }),
    );
  });

  describe("desactiver", function () {
    it(
      "si l'email n'existe pas, ne fait rien",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const utilisateurExistant = await fixtures.utilisateur();

        // When
        await repository.desactiver(
          "utilisateurinexistant@test.com",
          auteur.id,
        );

        // Then
        const utilisateurNonExistant = await tx.utilisateur.findFirst({
          where: { email: "utilisateurinexistant@test.com" },
        });
        const utilisateurApres = await tx.utilisateur.findFirst({
          where: { email: utilisateurExistant.email },
        });

        expect(utilisateurNonExistant).toBeNull();
        expect(utilisateurApres?.date_desactivation).toBeNull();
      }),
    );

    it(
      "si l'email existe, mets à jour la date de desactivation, la date de dernière modification et l'auteur modification",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const utilisateur = await fixtures.utilisateur({
          date_modification: new Date("2024-01-01"),
        });

        // When
        await repository.desactiver(utilisateur.email, auteur.id);

        // Then
        const utilisateurDesactive = await tx.utilisateur.findFirst({
          where: { email: utilisateur.email },
        });

        expect(utilisateurDesactive).not.toBeNull();
        expect(utilisateurDesactive?.date_desactivation).not.toBeNull();
        expect(
          utilisateurDesactive?.date_modification.toDateString(),
        ).toStrictEqual(new Date().toDateString());
        expect(utilisateurDesactive?.auteur_id_modification).toStrictEqual(
          auteur.id,
        );
      }),
    );
  });
  describe("reactiver", function () {
    it(
      "si l'email n'existe pas, ne fait rien",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const dateDesactivation = new Date();
        const utilisateurDesactive = await fixtures.utilisateur({
          date_desactivation: dateDesactivation,
          date_modification: new Date("2024-01-01"),
        });

        // When
        await repository.reactiver("utilisateurinexistant@test.com", auteur.id);

        // Then
        const utilisateurNonExistant = await tx.utilisateur.findFirst({
          where: { email: "utilisateurinexistant@test.com" },
        });
        const utilisateurApres = await tx.utilisateur.findFirst({
          where: { email: utilisateurDesactive.email },
        });

        expect(utilisateurNonExistant).toBeNull();
        expect(utilisateurApres?.date_desactivation).toStrictEqual(
          dateDesactivation,
        );
      }),
    );

    it(
      "si l'email existe, mets la date de desactivation à null et modifie la date de dernière modification",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const utilisateur = await fixtures.utilisateur({
          date_desactivation: new Date(),
          date_modification: new Date("2024-01-01"),
        });

        // When
        await repository.reactiver(utilisateur.email, auteur.id);

        // Then
        const utilisateurReactive = await tx.utilisateur.findFirst({
          where: { email: utilisateur.email },
        });

        expect(utilisateurReactive).not.toBeNull();
        expect(utilisateurReactive?.date_desactivation).toBeNull();
        expect(
          utilisateurReactive?.date_modification.toDateString(),
        ).toStrictEqual(new Date().toDateString());
        expect(utilisateurReactive?.auteur_id_modification).toStrictEqual(
          auteur.id,
        );
      }),
    );
  });

  describe("recupererComptesInactifs", function () {
    it(
      "retourne un tableau vide si aucun compte inactif",
      createIntegrationTest(async () => {
        // Given
        const dateReference = new Date("2025-01-15");
        await fixtures.utilisateur({
          date_derniere_connexion: new Date("2024-06-01"),
        });

        // When
        const result = await repository.recupererComptesInactifs(dateReference);

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "retourne les utilisateurs non desactives qui ont une date de derniere connexion supérieure à un an par rapport à la date de reference",
      createIntegrationTest(async () => {
        // Given
        const dateReference = new Date("2025-01-15");
        const datePremiereRelance = new Date("2024-12-01");
        const dateDeuxiemeRelance = new Date("2024-12-24");
        const dateDesactivationProgramee = new Date("2024-12-31");

        const inactifAvecRelances = await fixtures.utilisateur({
          date_derniere_connexion: new Date("2023-06-01"),
          date_premiere_relance_desactivation: datePremiereRelance,
          date_deuxieme_relance_desactivation: dateDeuxiemeRelance,
          date_desactivation_programee: dateDesactivationProgramee,
        });
        const inactifSansRelances = await fixtures.utilisateur({
          date_derniere_connexion: new Date("2024-01-14"),
        });
        // Utilisateur actif (connexion récente) - ne doit pas apparaître
        await fixtures.utilisateur({
          date_derniere_connexion: new Date("2024-06-01"),
        });
        // Utilisateur désactivé - ne doit pas apparaître
        await fixtures.utilisateur({
          date_derniere_connexion: new Date("2023-01-01"),
          date_desactivation: new Date("2024-01-01"),
        });

        // When
        const result = await repository.recupererComptesInactifs(dateReference);

        // Then
        expect(result).toEqual([
          {
            email: inactifAvecRelances.email,
            datePremiereRelanceDesactivation: datePremiereRelance,
            dateDeuxiemeRelanceDesactivation: dateDeuxiemeRelance,
            dateDesactivationProgramee: dateDesactivationProgramee,
            dateDerniereConnexion: new Date("2023-06-01"),
          },
          {
            email: inactifSansRelances.email,
            datePremiereRelanceDesactivation: null,
            dateDeuxiemeRelanceDesactivation: null,
            dateDesactivationProgramee: null,
            dateDerniereConnexion: new Date("2024-01-14"),
          },
        ]);
      }),
    );
  });
});
