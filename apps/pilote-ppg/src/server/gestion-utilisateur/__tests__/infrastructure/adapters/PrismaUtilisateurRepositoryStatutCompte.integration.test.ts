import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaUtilisateurRepository#statutCompte", () => {
  let repository: PrismaUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma: prismaPilote });
  });

  it(
    "retourne actif quand le compte n'a pas de date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.actif@exemple.gouv.fr",
        date_desactivation: null,
      });

      const statut = await repository.statutCompte("agent.actif@exemple.gouv.fr");

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

      const statut = await repository.statutCompte(
        "agent.desactive@exemple.gouv.fr",
      );

      expect(statut).toBe("desactive");
    }),
  );

  it(
    "retourne inconnu quand aucun compte ne porte cet email",
    createIntegrationTest(async () => {
      const statut = await repository.statutCompte("personne@exemple.gouv.fr");

      expect(statut).toBe("inconnu");
    }),
  );

  it(
    "normalise la casse et les espaces autour de l'email",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({ email: "agent.casse@exemple.gouv.fr" });

      const statut = await repository.statutCompte(
        "  Agent.Casse@Exemple.Gouv.FR  ",
      );

      expect(statut).toBe("actif");
    }),
  );
});
