import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetIndicateursPonderationsChantierQuery } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("GetIndicateursPonderationsChantierQuery", () => {
  let query: GetIndicateursPonderationsChantierQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetIndicateursPonderationsChantierQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne une liste vide si aucun indicateur n'est rattaché au chantier",
    createIntegrationTest(async () => {
      // Given / When
      const result = await query.run({ chantierId: "CH-999" });

      // Then
      expect(result).toEqual([]);
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
      const result = await query.run({ chantierId: "CH-010" });

      // Then
      expect(result).toEqual([
        {
          indicId: "IND-001",
          indicNom: "Taux de couverture",
          estActif: true,
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
      const result = await query.run({ chantierId: "CH-010" });

      // Then
      expect(result).toEqual([]);
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
      const result = await query.run({ chantierId: "CH-010" });

      // Then
      expect(result).toEqual([
        {
          indicId: "IND-001",
          indicNom: "Indicateur sans complément",
          estActif: true,
          maillesApplicables: ["NAT"],
          poidsPourcentDept: null,
          poidsPourcentReg: null,
          poidsPourcentNat: null,
        },
      ]);
    }),
  );
  it(
    "indique si chaque indicateur est actif et liste les actifs avant les inactifs",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
        indic_nom: "A - inactif",
        indic_hidden_pilote: true,
      });
      await fixtures.metadataIndicateurHidden({
        indic_id: "IND-002",
        indic_parent_ch: "CH-010",
        indic_nom: "B - actif",
        indic_hidden_pilote: false,
      });

      // When
      const result = await query.run({ chantierId: "CH-010" });

      // Then
      expect(result).toEqual([
        {
          indicId: "IND-002",
          indicNom: "B - actif",
          estActif: true,
          maillesApplicables: ["NAT"],
          poidsPourcentDept: null,
          poidsPourcentReg: null,
          poidsPourcentNat: null,
        },
        {
          indicId: "IND-001",
          indicNom: "A - inactif",
          estActif: false,
          maillesApplicables: ["NAT"],
          poidsPourcentDept: null,
          poidsPourcentReg: null,
          poidsPourcentNat: null,
        },
      ]);
    }),
  );
});
