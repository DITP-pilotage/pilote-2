import { estEnAlerteTypeAlerte } from "@/server/chantiers/domain/estEnAlerteTypeAlerte";
import type { ChantierTerritoireSignale } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

const buildChantierTerritoire = (
  overrides: Partial<ChantierTerritoireSignale> = {},
): ChantierTerritoireSignale => ({
  id: "CH-001",
  meteo: null,
  tendance: null,
  nombre_propositions_valeur_actuelle: 0,
  maille: "DEPT",
  chantier_identite: { nom: "Chantier test", cible_attendue: false },
  chantier_territoire_jalon: [],
  ...overrides,
});

const buildCtx = (
  overrides: Partial<Parameters<typeof estEnAlerteTypeAlerte>[1]> = {},
): Parameters<typeof estEnAlerteTypeAlerte>[1] => ({
  ct: buildChantierTerritoire(),
  maille: "DEPT",
  ecart: null,
  tauxAvancement: null,
  pvaIds: new Set(),
  chantiersAvecDept: new Set(),
  chantiersAvecTaux: new Set(),
  ...overrides,
});

describe("estEnAlerteTypeAlerte", () => {
  describe("estEnAlerteÉcart", () => {
    test("en alerte quand l'écart est <= -10", () => {
      // Given
      const ctx = buildCtx({ ecart: -15 });

      // When
      const résultat = estEnAlerteTypeAlerte("estEnAlerteÉcart", ctx);

      // Then
      expect(résultat).toBeTruthy();
    });

    test("pas en alerte quand l'écart est proche de 0", () => {
      // Given
      const ctx = buildCtx({ ecart: -5 });

      // When
      const résultat = estEnAlerteTypeAlerte("estEnAlerteÉcart", ctx);

      // Then
      expect(résultat).toBeFalsy();
    });
  });

  describe("estEnAlerteBaisse", () => {
    test("en alerte quand la tendance du chantier territoire est BAISSE", () => {
      // Given
      const ctx = buildCtx({
        ct: buildChantierTerritoire({ tendance: "BAISSE" }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte("estEnAlerteBaisse", ctx);

      // Then
      expect(résultat).toBeTruthy();
    });

    test("pas en alerte quand la tendance du chantier territoire est HAUSSE", () => {
      // Given
      const ctx = buildCtx({
        ct: buildChantierTerritoire({ tendance: "HAUSSE" }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte("estEnAlerteBaisse", ctx);

      // Then
      expect(résultat).toBeFalsy();
    });
  });

  describe("estEnAlerteTauxAvancementNonCalculé", () => {
    test("en alerte quand le taux est null et la cible attendue", () => {
      // Given
      const ctx = buildCtx({
        tauxAvancement: null,
        ct: buildChantierTerritoire({
          chantier_identite: { nom: "Chantier test", cible_attendue: true },
        }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteTauxAvancementNonCalculé",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("pas en alerte quand la cible n'est pas attendue", () => {
      // Given
      const ctx = buildCtx({
        tauxAvancement: null,
        ct: buildChantierTerritoire({
          chantier_identite: { nom: "Chantier test", cible_attendue: false },
        }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteTauxAvancementNonCalculé",
        ctx,
      );

      // Then
      expect(résultat).toBeFalsy();
    });
  });

  describe("estEnAlerteAbscenceTauxAvancementDepartemental", () => {
    test("en alerte quand le chantier n'a pas de département applicable et la cible est attendue", () => {
      // Given
      const ctx = buildCtx({
        chantiersAvecDept: new Set(),
        chantiersAvecTaux: new Set(),
        ct: buildChantierTerritoire({
          chantier_identite: { nom: "Chantier test", cible_attendue: true },
        }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteAbscenceTauxAvancementDepartemental",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("en alerte quand le département applicable n'a pas de taux renseigné", () => {
      // Given
      const ctx = buildCtx({
        chantiersAvecDept: new Set(["CH-001"]),
        chantiersAvecTaux: new Set(),
        ct: buildChantierTerritoire({
          chantier_identite: { nom: "Chantier test", cible_attendue: true },
        }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteAbscenceTauxAvancementDepartemental",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("pas en alerte quand le département applicable a un taux renseigné", () => {
      // Given
      const ctx = buildCtx({
        chantiersAvecDept: new Set(["CH-001"]),
        chantiersAvecTaux: new Set(["CH-001"]),
        ct: buildChantierTerritoire({
          chantier_identite: { nom: "Chantier test", cible_attendue: true },
        }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteAbscenceTauxAvancementDepartemental",
        ctx,
      );

      // Then
      expect(résultat).toBeFalsy();
    });
  });

  describe("estEnAlerteMétéoNonRenseignée", () => {
    test("en alerte quand la météo est absente en base (null)", () => {
      // Given
      const ctx = buildCtx({ ct: buildChantierTerritoire({ meteo: null }) });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteMétéoNonRenseignée",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("pas en alerte quand la météo est renseignée", () => {
      // Given
      const ctx = buildCtx({
        ct: buildChantierTerritoire({ meteo: "SOLEIL" }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlerteMétéoNonRenseignée",
        ctx,
      );

      // Then
      expect(résultat).toBeFalsy();
    });
  });

  describe("estEnAlertePossedePropositionsValeurAvancement", () => {
    test("au départemental, en alerte quand nombre_propositions_valeur_actuelle > 0", () => {
      // Given
      const ctx = buildCtx({
        maille: "DEPT",
        pvaIds: new Set(),
        ct: buildChantierTerritoire({ nombre_propositions_valeur_actuelle: 1 }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlertePossedePropositionsValeurAvancement",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("au départemental, pas en alerte quand nombre_propositions_valeur_actuelle vaut 0", () => {
      // Given
      const ctx = buildCtx({
        maille: "DEPT",
        pvaIds: new Set(),
        ct: buildChantierTerritoire({ nombre_propositions_valeur_actuelle: 0 }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlertePossedePropositionsValeurAvancement",
        ctx,
      );

      // Then
      expect(résultat).toBeFalsy();
    });

    test("au national, en alerte quand le chantier est dans pvaIds", () => {
      // Given
      const ctx = buildCtx({
        maille: "NAT",
        pvaIds: new Set(["CH-001"]),
        ct: buildChantierTerritoire({ nombre_propositions_valeur_actuelle: 0 }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlertePossedePropositionsValeurAvancement",
        ctx,
      );

      // Then
      expect(résultat).toBeTruthy();
    });

    test("au national, pas en alerte quand le chantier n'est pas dans pvaIds", () => {
      // Given
      const ctx = buildCtx({
        maille: "NAT",
        pvaIds: new Set(),
        ct: buildChantierTerritoire({ nombre_propositions_valeur_actuelle: 0 }),
      });

      // When
      const résultat = estEnAlerteTypeAlerte(
        "estEnAlertePossedePropositionsValeurAvancement",
        ctx,
      );

      // Then
      expect(résultat).toBeFalsy();
    });
  });
});
