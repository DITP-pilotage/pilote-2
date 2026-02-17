import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetProfilUtilisateurQuery } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

describe("GetProfilUtilisateurQuery", () => {
  let query: GetProfilUtilisateurQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetProfilUtilisateurQuery({
      prisma: prismaPilote,
    });
  });

  describe("run", () => {
    it(
      "retourne le profil de l'utilisateur",
      createIntegrationTest(async () => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          fonction: "Développeur",
          service: "prefecture-de-region",
          service_autre: null,
        });

        const result = await query.run(utilisateur.id);

        expect(result).toEqual({
          id: utilisateur.id,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          fonction: "Développeur",
          perimetreMinisteriel: null,
          service: "prefecture-de-region",
          serviceAutre: null,
        });
      }),
    );

    it(
      "lance une erreur si l'utilisateur n'existe pas",
      createIntegrationTest(async () => {
        await expect(query.run(randomUUID())).rejects.toThrow(NotFoundError);
      }),
    );

    it(
      "retourne le profil avec fonction null",
      createIntegrationTest(async () => {
        const utilisateur = await fixtures.utilisateur({
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
          fonction: null,
          service: null,
          service_autre: null,
        });

        const result = await query.run(utilisateur.id);

        expect(result).toEqual({
          id: utilisateur.id,
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
          fonction: null,
          perimetreMinisteriel: null,
          service: null,
          serviceAutre: null,
        });
      }),
    );
  });
});
