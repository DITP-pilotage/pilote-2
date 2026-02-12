import { mock, MockProxy } from "jest-mock-extended";
import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaProfilUtilisateurRepository } from "@/server/profil-utilisateur/infrastructure/adapters/PrismaProfilUtilisateurRepository";
import { ModifierMonProfilUseCase } from "@/server/profil-utilisateur/usecases/ModifierMonProfilUseCase";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";

describe("ModifierMonProfilUseCase", () => {
  let useCase: ModifierMonProfilUseCase;
  let profilUtilisateurRepository: PrismaProfilUtilisateurRepository;
  let profilModifieSideEffects: MockProxy<ProfilModifieSideEffects>;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    profilUtilisateurRepository = new PrismaProfilUtilisateurRepository({
      prisma: prismaPilote,
    });
    profilModifieSideEffects = mock<ProfilModifieSideEffects>();
    useCase = new ModifierMonProfilUseCase({
      profilUtilisateurRepository,
      profilModifieSideEffects,
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
                    service: null,
          serviceAutre: null,
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
                    service: null,
          serviceAutre: null,
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
                    service: null,
          serviceAutre: null,
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
      "modifie le service",
      createIntegrationTest(async (tx) => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: "Fonction Test",
          service: null,
          service_autre: null,
        });

        await useCase.run(utilisateur.id, {
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: "Fonction Test",
          service:
            "direction-interregionale-de-la-protection-judiciaire-de-la-jeunesse-dirpjj",
          serviceAutre: null,
        });

        const utilisateurModifie = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
        });

        expect(utilisateurModifie).toMatchObject({
          nom: "Nom Test",
          prenom: "Prenom Test",
          fonction: "Fonction Test",
          service:
            "direction-interregionale-de-la-protection-judiciaire-de-la-jeunesse-dirpjj",
          service_autre: null,
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
                    service: null,
          serviceAutre: null,
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

    it(
      "lance une erreur si l'utilisateur n'existe pas",
      createIntegrationTest(async () => {
        await expect(
          useCase.run(randomUUID(), {
            nom: "Nouveau Nom",
            prenom: "Nouveau Prenom",
            fonction: null,
                        service: null,
            serviceAutre: null,
          }),
        ).rejects.toThrow(NotFoundError);
      }),
    );

    it(
      "appelle les side effects avec le profil modifie",
      createIntegrationTest(async () => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Ancien Nom",
          prenom: "Ancien Prenom",
          email: "test@example.com",
          fonction: "Ancienne Fonction",
        });

        await useCase.run(utilisateur.id, {
          nom: "Nouveau Nom",
          prenom: "Nouveau Prenom",
          fonction: "Nouvelle Fonction",
          service: "prefecture-de-region",
          serviceAutre: null,
        });

        expect(profilModifieSideEffects.executer).toHaveBeenCalledWith({
          id: utilisateur.id,
          nom: "Nouveau Nom",
          prenom: "Nouveau Prenom",
          email: "test@example.com",
          fonction: "Nouvelle Fonction",
          service: "prefecture-de-region",
          serviceAutre: null,
        });
      }),
    );
  });
});
