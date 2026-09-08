import { PrismaUtilisateurRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaUtilisateurRepository#mettreAJourDateDerniereConnexion", () => {
  let repository: PrismaUtilisateurRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaUtilisateurRepository({ prisma: prismaPilote });
  });

  it(
    "enregistre la date et le provider de la connexion",
    createIntegrationTest(async () => {
      // Given
      await fixtures.utilisateur({ email: "agent.trace@exemple.gouv.fr" });

      // When
      await repository.mettreAJourDateDerniereConnexion({
        email: "agent.trace@exemple.gouv.fr",
        date: new Date("2026-09-08T10:00:00Z"),
        provider: "proconnect",
      });

      // Then
      const utilisateurs = await prismaPilote
        .getInstance()
        .utilisateur.findMany({
          where: { email: "agent.trace@exemple.gouv.fr" },
        });
      expect(utilisateurs).toEqual([
        expect.objectContaining({
          email: "agent.trace@exemple.gouv.fr",
          date_derniere_connexion: new Date("2026-09-08T10:00:00Z"),
          dernier_provider_connexion: "proconnect",
        }),
      ]);
    }),
  );

  it(
    "écrase le provider précédent à la connexion suivante",
    createIntegrationTest(async () => {
      // Given
      await fixtures.utilisateur({
        email: "agent.bascule@exemple.gouv.fr",
        dernier_provider_connexion: "keycloak",
      });

      // When
      await repository.mettreAJourDateDerniereConnexion({
        email: "agent.bascule@exemple.gouv.fr",
        date: new Date("2026-09-08T11:00:00Z"),
        provider: "proconnect",
      });

      // Then
      const utilisateurs = await prismaPilote
        .getInstance()
        .utilisateur.findMany({
          where: { email: "agent.bascule@exemple.gouv.fr" },
        });
      expect(utilisateurs).toEqual([
        expect.objectContaining({
          dernier_provider_connexion: "proconnect",
        }),
      ]);
    }),
  );
});
