import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererIndicateursPonderationsChantierQuery } from "@/server/metadataChantier/queries/RecupererIndicateursPonderationsChantierQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererIndicateursPonderationsChantierQuery", () => {
  let query: RecupererIndicateursPonderationsChantierQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererIndicateursPonderationsChantierQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne une liste vide si aucun indicateur n'est rattaché au chantier",
    createIntegrationTest(async () => {
      // Given / When
      const résultat = await query.run({ chantierId: "CH-999" });

      // Then
      expect(résultat).toEqual([]);
    }),
  );

  it(
    "retourne les indicateurs rattachés au chantier avec leurs pondérations et mailles applicables",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      const indicateur = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
        indic_nom: "Taux de couverture",
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur.indic_id,
        indic_territorialise: true,
        mailles: "REG",
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur.indic_id,
        poids_pourcent_dept_declaree: null,
        poids_pourcent_reg_declaree: 60,
        poids_pourcent_nat_declaree: 100,
      });

      // When
      const résultat = await query.run({ chantierId: "CH-010" });

      // Then
      expect(résultat).toEqual([
        {
          indicId: "IND-001",
          indicNom: "Taux de couverture",
          maillesApplicables: ["NAT", "REG"],
          poidsPourcentDept: null,
          poidsPourcentReg: 60,
          poidsPourcentNat: 100,
        },
      ]);
    }),
  );

  it(
    "n'inclut pas les indicateurs rattachés à un autre chantier",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      await fixtures.metadataChantier({ chantier_id: "CH-020" });
      await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-020",
      });

      // When
      const résultat = await query.run({ chantierId: "CH-010" });

      // Then
      expect(résultat).toEqual([]);
    }),
  );

  it(
    "utilise des valeurs par défaut si l'indicateur n'a pas de complémentaire ni de parametrage",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
        indic_nom: "Indicateur sans complément",
      });

      // When
      const résultat = await query.run({ chantierId: "CH-010" });

      // Then
      expect(résultat).toEqual([
        {
          indicId: "IND-001",
          indicNom: "Indicateur sans complément",
          maillesApplicables: ["NAT"],
          poidsPourcentDept: null,
          poidsPourcentReg: null,
          poidsPourcentNat: null,
        },
      ]);
    }),
  );
});
