import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { createCreateDashboardTool } from "@/server/albert/tools/createDashboard";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";

vi.mock("@/config", () => ({
  configuration: () => ({ albert: { apiKey: "cle-de-test", devTools: false } }),
}));

describe("createCreateDashboardTool description", () => {
  test("garde la carte du niveau de confiance et n'envoie au dashboard ni météo écrite, ni niveau de confiance en texte, ni commentaire", () => {
    // When
    const tool = createCreateDashboardTool({
      getIndicateurContexteQuery: mock<GetIndicateurContexteQuery>(),
    })({ chantiersAccessibles: [] });

    // Then
    expect(tool.description).not.toContain(
      "n'affiche ni le niveau de confiance",
    );
    expect(tool.description).toContain(
      "Un dashboard n'affiche aucun commentaire de chantier, ni le niveau de confiance écrit en texte ; la carte du niveau de confiance (cartographie météo) reste disponible.",
    );
    expect(tool.description).toContain(
      "Ne mets dans `task` ni la météo écrite, ni le niveau de confiance en texte, ni un commentaire",
    );
  });
});
