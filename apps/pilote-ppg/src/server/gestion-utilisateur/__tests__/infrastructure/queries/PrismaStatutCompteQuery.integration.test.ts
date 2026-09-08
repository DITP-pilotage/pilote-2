import { PrismaStatutCompteQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaStatutCompteQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaStatutCompteQuery", () => {
  let query: PrismaStatutCompteQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new PrismaStatutCompteQuery({ prisma: prismaPilote });
  });

  it(
    "retourne actif quand le compte n'a pas de date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.actif@exemple.gouv.fr",
        date_desactivation: null,
      });

      const statut = await query.recuperer({
        email: "agent.actif@exemple.gouv.fr",
      });

      expect(statut).toBe("actif");
    }),
  );

  it(
    "retourne desactive quand le compte porte une date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.desactive@exemple.gouv.fr",
        date_desactivation: new Date("2026-01-15"),
      });

      const statut = await query.recuperer({
        email: "agent.desactive@exemple.gouv.fr",
      });

      expect(statut).toBe("desactive");
    }),
  );

  it(
    "retourne inconnu quand aucun compte ne porte cet email",
    createIntegrationTest(async () => {
      const statut = await query.recuperer({
        email: "personne@exemple.gouv.fr",
      });

      expect(statut).toBe("inconnu");
    }),
  );

  it(
    "normalise la casse et les espaces autour de l'email",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({ email: "agent.casse@exemple.gouv.fr" });

      const statut = await query.recuperer({
        email: "  Agent.Casse@Exemple.Gouv.FR  ",
      });

      expect(statut).toBe("actif");
    }),
  );
});
