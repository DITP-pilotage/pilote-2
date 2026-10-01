import { vueDEnsemblePdf } from "@/server/rapport-detaille/pdf/vueDEnsemble";
import { chantiersTablePdf } from "@/server/rapport-detaille/pdf/chantiersTable";
import {
  buildTestContext,
  buildTestVueDEnsemble,
  renderPdf,
  textOf,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { buildTestChantier } from "@/server/rapport-detaille/testData";

describe("vueDEnsemblePdf", () => {
  it("affiche les sections et les alertes nationales", async () => {
    const content = vueDEnsemblePdf(
      buildTestVueDEnsemble(),
      buildTestContext(),
    );

    const text = textOf(content);
    expect(text).toContain("Vue d'ensemble");
    expect(text).toContain("Taux d'avancement moyen");
    expect(text).toContain("42%");
    expect(text).toContain("Taux d'avancement à échéance");
    expect(text).toContain("Répartition des météos renseignées");
    expect(text).toContain("Objectifs compromis");
    expect(text).toContain("Taux d'avancement des chantiers par territoire");
    expect(text).toContain("Chantiers signalés");
    expect(text).toContain(
      "Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés",
    );
    expect(text).toContain(
      "Chantier(s) avec proposition(s) de valeur d'avancement",
    );
    expect(text).not.toContain("Chantier(s) avec tendance en baisse");
    expect(text).toContain("Liste des chantiers");
    expect(await renderPdf(content)).toBe("%PDF");
  });

  it("affiche les alertes territoriales hors national", () => {
    const text = textOf(
      vueDEnsemblePdf(buildTestVueDEnsemble(), buildTestContext({}, "DEPT-75")),
    );

    expect(text).toContain(
      "Chantier(s) avec un retard de 10 points par rapport à leur médiane departementale",
    );
    expect(text).toContain("Chantier(s) avec tendance en baisse");
    expect(text).not.toContain("Chantier(s) sans taux d'avancement");
  });

  it("affiche « - % » sans moyenne et masque les alertes pour des chantiers archivés", () => {
    const text = textOf(
      vueDEnsemblePdf(
        buildTestVueDEnsemble({
          moyenneTauxAvancementTerritoire: null,
          chantiersSontArchives: true,
        }),
        buildTestContext(),
      ),
    );

    expect(text).toContain("- %");
    expect(text).not.toContain("Chantiers signalés");
  });
});

describe("chantiersTablePdf", () => {
  it("affiche le bandeau vide sans chantier", () => {
    expect(textOf(chantiersTablePdf([], false))).toContain(
      "Aucun chantier à afficher.",
    );
  });

  it("affiche les colonnes, la météo non renseignée, l'avancement et l'écart", async () => {
    const table = chantiersTablePdf(
      [
        buildTestChantier({
          nom: "Réduire les délais",
          avancement: 42.6,
          ecart: -12.34,
          tendance: "HAUSSE",
          dateDeMàjDonnéesQuantitatives: "2026-06-15T00:00:00Z",
        }),
      ],
      false,
    );

    const text = textOf(table);
    expect(text).toContain(
      "Chantiers Typologie Météo Tendance Avancement Écart",
    );
    expect(text).toContain("Réduire les délais");
    expect(text).toContain("Non renseignée");
    expect(text).toContain("EN HAUSSE");
    expect(text).toContain("43 %");
    expect(text).toContain("(06/2026)");
    expect(text).toContain("-12.3");
    expect(await renderPdf(table)).toBe("%PDF");
  });
});
