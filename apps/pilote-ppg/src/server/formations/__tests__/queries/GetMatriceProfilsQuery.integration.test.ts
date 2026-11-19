import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetMatriceProfilsQuery } from "@/server/formations/queries/GetMatriceProfilsQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetMatriceProfilsQuery", () => {
  let query: GetMatriceProfilsQuery;

  beforeEach(() => {
    query = new GetMatriceProfilsQuery({ prisma: new PrismaPilote() });
  });

  it(
    "retourne les profils, les motifs non supprimés triés par nom et leurs associations",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1), nom: "B formation" });
      await fixtures.formationMotif({ id: BigInt(2), nom: "A formation" });
      await fixtures.formationMotif({
        id: BigInt(3),
        nom: "C supprimée",
        deleted_at: new Date("2026-11-01T00:00:00Z"),
      });
      await prisma.formation_motif_profil.createMany({
        data: [
          { motif_id: BigInt(2), profil_code: "DITP_ADMIN" },
          { motif_id: BigInt(3), profil_code: "DITP_ADMIN" },
        ],
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat.motifs).toEqual([
        { id: 2, nom: "A formation" },
        { id: 1, nom: "B formation" },
      ]);
      expect(resultat.associations).toEqual([
        { motifId: 2, profilCode: "DITP_ADMIN" },
      ]);
      expect(resultat.profils).toContainEqual({
        code: "DITP_ADMIN",
        nom: "DITP - Admin",
      });
    }),
  );
});
