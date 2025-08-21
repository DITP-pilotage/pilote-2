import { PrismaIndicateurRepository } from "@/server/import-indicateur/infrastructure/adapters/PrismaIndicateurRepository";
import { InformationIndicateur } from "@/server/import-indicateur/domain/InformationIndicateur";
import { prisma } from "@/server/db/prisma";

describe("PrismaIndicateurRepository", () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository();
  });

  describe("#recupererInformationIndicateurParId", () => {
    describe("quand l'indicateur existe dans metadata_indicateurs_hidden", () => {
      it("doit retourner les informations de l'indicateur", async () => {
        // GIVEN
        const indicId = "TEST-INDIC-001";
        const indicSchema = "test-schema.json";

        await prisma.metadata_indicateurs_hidden.create({
          data: {
            indic_id: indicId,
            indic_parent_ch: "TEST-CHANTIER-001",
            indic_nom: "Test Indicateur",
            indic_schema: indicSchema,
          },
        });

        // WHEN
        const result =
          await prismaIndicateurRepository.recupererInformationIndicateurParId(
            indicId,
          );

        // THEN
        expect(result).toBeInstanceOf(InformationIndicateur);
        expect(result.indicId).toBe(indicId);
        expect(result.indicSchema).toBe(indicSchema);
      });
    });

    describe("quand l'indicateur n'existe pas", () => {
      it("doit retourner un indicateur avec le schema par défaut", async () => {
        // GIVEN
        const indicIdInexistant = "INEXISTANT-001";

        // WHEN
        const result =
          await prismaIndicateurRepository.recupererInformationIndicateurParId(
            indicIdInexistant,
          );

        // THEN
        expect(result).toBeInstanceOf(InformationIndicateur);
        expect(result.indicId).toBe(indicIdInexistant);
        expect(result.indicSchema).toBe("sans-contraintes.json");
      });
    });

    describe("quand une erreur de base de données se produit", () => {
      it("doit retourner un indicateur avec le schema par défaut en cas d'erreur", async () => {
        // GIVEN
        const indicId = "TEST-INDIC-ERROR";

        // On simule une erreur en fermant temporairement la connexion
        await prisma.$disconnect();

        // WHEN
        const result =
          await prismaIndicateurRepository.recupererInformationIndicateurParId(
            indicId,
          );

        // THEN
        expect(result).toBeInstanceOf(InformationIndicateur);
        expect(result.indicId).toBe(indicId);
        expect(result.indicSchema).toBe("sans-contraintes.json");

        // Reconnexion pour les autres tests
        await prisma.$connect();
      });
    });
  });
});
