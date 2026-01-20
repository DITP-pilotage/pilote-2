import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";

describe("ModifierMonProfilUseCase", () => {
  let useCase: ModifierMonProfilUseCase;
  let utilisateurRepository: PrismaUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    utilisateurRepository = new PrismaUtilisateurRepository({
      prisma: prismaPilote,
    });
    useCase = new ModifierMonProfilUseCase({
      utilisateurRepository,
    });
  });

  describe("run", () => {
    it(
      "modifie le profil de l'utilisateur connecte",
      createIntegrationTest(async (tx) => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Ancien Nom",
          prenom: "Ancien Prenom",
          fonction: "Ancienne Fonction",
        });

        await useCase.run(utilisateur.id, {
          nom: "Nouveau Nom",
          prenom: "Nouveau Prenom",
          fonction: "Nouvelle Fonction",
        });

        const utilisateurModifie = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
        });

        expect(utilisateurModifie).toMatchObject({
          nom: "Nouveau Nom",
          prenom: "Nouveau Prenom",
          fonction: "Nouvelle Fonction",
        });
      }),
    );

    it(
      "permet de modifier uniquement le nom",
      createIntegrationTest(async (tx) => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Nom Original",
          prenom: "Prenom Original",
          fonction: "Fonction Originale",
        });

        await useCase.run(utilisateur.id, {
          nom: "Nouveau Nom",
          prenom: "Prenom Original",
          fonction: "Fonction Originale",
        });

        const utilisateurModifie = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
        });

        expect(utilisateurModifie).toMatchObject({
          nom: "Nouveau Nom",
          prenom: "Prenom Original",
          fonction: "Fonction Originale",
        });
      }),
    );

    it(
      "permet de mettre la fonction a null",
      createIntegrationTest(async (tx) => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: "Fonction Initiale",
        });

        await useCase.run(utilisateur.id, {
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: null,
        });

        const utilisateurModifie = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
        });

        expect(utilisateurModifie).toMatchObject({
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: null,
        });
      }),
    );

    it(
      "met a jour la date de modification",
      createIntegrationTest(async (tx) => {
        const dateInitiale = new Date("2024-01-01");
        const utilisateur = await fixtures.utilisateur({
          nom: "Nom Test",
          prenom: "Prenom Test",
          date_modification: dateInitiale,
        });

        await useCase.run(utilisateur.id, {
          nom: "Nouveau Nom",
          prenom: "Nouveau Prenom",
          fonction: null,
        });

        const utilisateurModifie = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
        });

        expect(utilisateurModifie?.date_modification).not.toEqual(dateInitiale);
        expect(utilisateurModifie?.date_modification.getTime()).toBeGreaterThan(
          dateInitiale.getTime(),
        );
      }),
    );
  });
});
