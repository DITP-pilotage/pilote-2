import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { creerProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

describe("PrismaProfilUtilisateurRepository", () => {
  let repository: PrismaProfilUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaProfilUtilisateurRepository({
      prisma: prismaPilote,
    });
  });

  describe("recupererParId", () => {
    it(
      "retourne service et serviceAutre correctement",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          perimetre_ministeriel: "culture",
          service: "administration-centrale",
          service_autre: null,
        });

        // When
        const result = await repository.recupererParId(utilisateur.id);

        // Then
        expect(result).toEqual({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          perimetreMinisteriel: "culture",
          service: "administration-centrale",
          serviceAutre: null,
        });
      }),
    );

    it(
      "retourne serviceAutre quand service est 'autre'",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          perimetre_ministeriel: "autre",
          service: "autre",
          service_autre: "Service très spécifique",
        });

        // When
        const result = await repository.recupererParId(utilisateur.id);

        // Then
        expect(result).toEqual({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          perimetreMinisteriel: "autre",
          service: "autre",
          serviceAutre: "Service très spécifique",
        });
      }),
    );

    it(
      "retourne null pour les 2 champs quand non renseignés",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          service: null,
          service_autre: null,
        });

        // When
        const result = await repository.recupererParId(utilisateur.id);

        // Then
        expect(result).toEqual({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          perimetreMinisteriel: null,
          service: null,
          serviceAutre: null,
        });
      }),
    );

    it(
      "lève une NotFoundError si l'utilisateur n'existe pas",
      createIntegrationTest(async () => {
        // Given
        const utilisateurIdInexistant = "00000000-0000-0000-0000-000000000000";

        // When / Then
        await expect(
          repository.recupererParId(utilisateurIdInexistant),
        ).rejects.toThrow(NotFoundError);
      }),
    );
  });

  describe("sauvegarder", () => {
    it(
      "persiste service",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          service: null,
          service_autre: null,
        });

        const profilModifie = creerProfilUtilisateur({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          perimetreMinisteriel: "education-nationale",
          service: "rectorat-d-academie",
          serviceAutre: null,
        });

        // When
        await repository.sauvegarder({
          profil: profilModifie,
          auteurId: utilisateur.id,
        });

        // Then
        const result = await repository.recupererParId(utilisateur.id);
        expect(result.perimetreMinisteriel).toEqual("education-nationale");
        expect(result.service).toEqual("rectorat-d-academie");
        expect(result.serviceAutre).toBeNull();
      }),
    );

    it(
      "persiste serviceAutre quand service est 'autre'",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          service: null,
          service_autre: null,
        });

        const profilModifie = creerProfilUtilisateur({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          service: "autre",
          serviceAutre: "Service spécial",
          perimetreMinisteriel: "autre",
        });

        // When
        await repository.sauvegarder({
          profil: profilModifie,
          auteurId: utilisateur.id,
        });

        // Then
        const result = await repository.recupererParId(utilisateur.id);
        expect(result.perimetreMinisteriel).toEqual("autre");
        expect(result.service).toEqual("autre");
        expect(result.serviceAutre).toEqual("Service spécial");
      }),
    );

    it(
      "permet de remettre les champs à null",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          service: "prefecture-de-departement",
          service_autre: null,
        });

        const profilModifie = creerProfilUtilisateur({
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          fonction: utilisateur.fonction,
          service: null,
          serviceAutre: null,
          perimetreMinisteriel: null,
        });

        // When
        await repository.sauvegarder({
          profil: profilModifie,
          auteurId: utilisateur.id,
        });

        // Then
        const result = await repository.recupererParId(utilisateur.id);
        expect(result.service).toBeNull();
        expect(result.serviceAutre).toBeNull();
      }),
    );

    it(
      "crée un utilisateur avec les nouveaux champs",
      createIntegrationTest(async () => {
        // Given
        const nouvelUtilisateurId = "12345678-1234-1234-1234-123456789012";
        const profil = creerProfilUtilisateur({
          id: nouvelUtilisateurId,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.fr",
          fonction: "Directeur",
          perimetreMinisteriel: "culture",
          service: "direction-regionale-des-affaires-culturelles-drac",
          serviceAutre: null,
        });

        // When
        await repository.sauvegarder({
          profil: profil,
          auteurId: nouvelUtilisateurId,
        });

        // Then
        const result = await repository.recupererParId(nouvelUtilisateurId);
        expect(result).toEqual({
          id: nouvelUtilisateurId,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.fr",
          fonction: "Directeur",
          perimetreMinisteriel: "culture",
          service: "direction-regionale-des-affaires-culturelles-drac",
          serviceAutre: null,
        });
      }),
    );
  });
});
