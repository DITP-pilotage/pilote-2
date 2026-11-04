import { describe, expect, test, vi } from "vitest";
import { verifierCarteAvecChantier } from "@/server/albert/tools/createDashboard";

vi.mock("@/config", () => ({
  configuration: () => ({ albert: { apiKey: "cle-de-test", devTools: false } }),
}));

describe("verifierCarteAvecChantier", () => {
  test("refuse une carte sans chantier", () => {
    // When / Then
    expect(() =>
      verifierCarteAvecChantier({
        task: "Carte du taux d'avancement par région",
        chantiers: undefined,
      }),
    ).toThrow("aucun chantier n'est passé");
  });

  test("refuse une cartographie avec une liste de chantiers vide", () => {
    // When / Then
    expect(() =>
      verifierCarteAvecChantier({
        task: "Cartographie du niveau de confiance",
        chantiers: [],
      }),
    ).toThrow("aucun chantier n'est passé");
  });

  test("accepte une carte d'un chantier précis", () => {
    // When / Then
    expect(() =>
      verifierCarteAvecChantier({
        task: "Carte de France du taux d'avancement du CH-004 par région",
        chantiers: [{ id: "CH-004", nom: "Accès aux soins" }],
      }),
    ).not.toThrow();
  });

  test("accepte un dashboard sans carte et sans chantier", () => {
    // When / Then
    expect(() =>
      verifierCarteAvecChantier({
        task: "Tableau de bord de la Bretagne : taux d'avancement et chantiers en retard",
        chantiers: undefined,
      }),
    ).not.toThrow();
  });
});
