import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import {
  compterPva,
  chantiersSansTauxDepartemental,
} from "@/server/chantiers/infrastructure/queries/RequetesCategoriesSignalement";
import type { ChantierTerritoireAvecJalon } from "@/server/chantiers/domain/CalculCategoriesSignalement";

const JALON = 2025;

const chantierTerritoireCibleAttendue: ChantierTerritoireAvecJalon = {
  id: "CH-000",
  meteo: "SOLEIL",
  tendance: "HAUSSE",
  nombre_propositions_valeur_actuelle: 0,
  chantier_identite: { cible_attendue: true },
  chantier_territoire_jalon: [],
};

describe("compterPva", () => {
  it(
    "retourne un Set vide pour une maille DEPT (pas de roll-up)",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001" });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 3,
      });

      // When
      const result = await compterPva(prisma, "DEPT", ["CH-001"], {
        territoireCode: "DEPT-75",
      });

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "agrège au national les PVA portées par n'importe quel territoire REG ou DEPT, sans restriction de hiérarchie",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-002" });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 2,
      });

      // When
      const result = await compterPva(prisma, "NAT", ["CH-002"], {
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual(new Set(["CH-002"]));
    }),
  );

  it(
    "exclut au national les chantiers non applicables, sans PVA, ou hors périmètre demandé",
    createIntegrationTest(async (prisma) => {
      // Given — CH-003 non applicable, CH-004 sans PVA, CH-005 avec PVA mais hors filtre
      await fixtures.chantierIdentite({ id: "CH-003" });
      await fixtures.chantierTerritoire({
        id: "CH-003",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: false,
        nombre_propositions_valeur_actuelle: 5,
      });
      await fixtures.chantierIdentite({ id: "CH-004" });
      await fixtures.chantierTerritoire({
        id: "CH-004",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierIdentite({ id: "CH-005" });
      await fixtures.chantierTerritoire({
        id: "CH-005",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 1,
      });

      // When
      const result = await compterPva(prisma, "NAT", ["CH-003", "CH-004"], {
        territoireCode: "NAT-FR",
      });

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "agrège pour une région les PVA de ses départements enfants (REG-11 > DEPT-75, référentiel seedé)",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-006" });
      await fixtures.chantierTerritoire({
        id: "CH-006",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 1,
      });

      // When
      const result = await compterPva(prisma, "REG", ["CH-006"], {
        territoireCode: "REG-11",
      });

      // Then
      expect(result).toEqual(new Set(["CH-006"]));
    }),
  );

  it(
    "inclut aussi une PVA portée directement par le territoire régional lui-même",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-007" });
      await fixtures.chantierTerritoire({
        id: "CH-007",
        territoire_code: "REG-11",
        maille: "REG",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 1,
      });

      // When
      const result = await compterPva(prisma, "REG", ["CH-007"], {
        territoireCode: "REG-11",
      });

      // Then
      expect(result).toEqual(new Set(["CH-007"]));
    }),
  );

  it(
    "exclut pour une région un département qui n'est pas un de ses enfants (DEPT-13 est rattaché à REG-93, pas REG-11)",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-008" });
      await fixtures.chantierTerritoire({
        id: "CH-008",
        territoire_code: "DEPT-13",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 1,
      });

      // When
      const result = await compterPva(prisma, "REG", ["CH-008"], {
        territoireCode: "REG-11",
      });

      // Then
      expect(result).toEqual(new Set());
    }),
  );
});

describe("chantiersSansTauxDepartemental", () => {
  it(
    "retourne un Set vide si la maille n'est pas NAT (aucune requête déclenchée)",
    createIntegrationTest(async (prisma) => {
      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "REG",
        [chantierTerritoireCibleAttendue],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "retourne un Set vide quand aucun chantier n'a de cible attendue",
    createIntegrationTest(async (prisma) => {
      // Given
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-009",
        chantier_identite: { cible_attendue: false },
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "inclut un chantier cible_attendue dont le taux départemental est null pour le jalon demandé",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-010" });
      await fixtures.chantierTerritoire({
        id: "CH-010",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-010",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        jalon: JALON,
        taux_avancement: null,
      });
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-010",
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set(["CH-010"]));
    }),
  );

  it(
    "exclut un chantier cible_attendue dont le taux départemental est renseigné pour le jalon demandé",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-011" });
      await fixtures.chantierTerritoire({
        id: "CH-011",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-011",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        jalon: JALON,
        taux_avancement: 42,
      });
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-011",
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "inclut un chantier cible_attendue sans aucune donnée de jalon départemental pour l'année demandée",
    createIntegrationTest(async (prisma) => {
      // Given — déclinaison départementale existante, mais aucun chantier_territoire_jalon pour JALON
      await fixtures.chantierIdentite({ id: "CH-012" });
      await fixtures.chantierTerritoire({
        id: "CH-012",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: true,
      });
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-012",
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set(["CH-012"]));
    }),
  );

  it(
    "exclut un chantier cible_attendue qui n'est pas piloté au niveau départemental",
    createIntegrationTest(async (prisma) => {
      // Given — aucune déclinaison DEPT pour ce chantier
      await fixtures.chantierIdentite({ id: "CH-013" });
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-013",
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set());
    }),
  );

  it(
    "exclut un chantier dont la déclinaison départementale existe mais n'est pas applicable",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-014" });
      await fixtures.chantierTerritoire({
        id: "CH-014",
        territoire_code: "DEPT-75",
        maille: "DEPT",
        est_applicable: false,
      });
      const chantier: ChantierTerritoireAvecJalon = {
        ...chantierTerritoireCibleAttendue,
        id: "CH-014",
      };

      // When
      const result = await chantiersSansTauxDepartemental(
        prisma,
        "NAT",
        [chantier],
        JALON,
      );

      // Then
      expect(result).toEqual(new Set());
    }),
  );
});
