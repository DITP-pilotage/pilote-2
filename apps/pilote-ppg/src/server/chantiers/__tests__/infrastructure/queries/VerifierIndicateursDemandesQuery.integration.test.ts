import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { VerifierIndicateursDemandesQuery } from "@/server/chantiers/infrastructure/queries/VerifierIndicateursDemandesQuery";

const FINISTERE = {
  territoire_code: "DEPT-29",
  code_insee: "29",
  maille: "DEPT" as const,
  zone_id: "D29",
};
const ILLE_ET_VILAINE = {
  territoire_code: "DEPT-35",
  code_insee: "35",
  maille: "DEPT" as const,
  zone_id: "D35",
};

describe("VerifierIndicateursDemandesQuery", () => {
  const query = new VerifierIndicateursDemandesQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "renvoie le chantier de chaque indicateur publié et s'il est applicable sur les territoires demandés",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-001" });
      for (const territoire of [FINISTERE, ILLE_ET_VILAINE]) {
        await fixtures.chantierTerritoire({ id: "CH-001", ...territoire });
      }
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
      });
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-001",
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
      });
      // Applicable uniquement hors des territoires demandés
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: false,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
      });

      // when
      const result = await query.execute({
        indicateurIds: ["IND-001", "IND-002"],
        territoireCodes: ["DEPT-29"],
      });

      // then
      expect(result).toEqual([
        { id: "IND-001", chantierId: "CH-001", estApplicable: true },
        { id: "IND-002", chantierId: "CH-001", estApplicable: false },
      ]);
    }),
  );

  it(
    "ignore les indicateurs inexistants, non publiés ou rattachés à un chantier non publié",
    createIntegrationTest(async () => {
      // given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierIdentite({ id: "CH-002", statut: "BROUILLON" });
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
        statut: "SUPPRIME",
      });
      await fixtures.indicateurIdentite({
        id: "IND-002",
        chantier_id: "CH-002",
      });

      // when
      const result = await query.execute({
        indicateurIds: ["IND-001", "IND-002", "IND-404"],
        territoireCodes: ["DEPT-29"],
      });

      // then
      expect(result).toEqual([]);
    }),
  );
});
