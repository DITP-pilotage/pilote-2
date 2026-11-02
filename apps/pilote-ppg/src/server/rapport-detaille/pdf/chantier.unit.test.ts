import { chantierPdf } from "@/server/rapport-detaille/pdf/chantier";
import {
  buildTestChantierDetail,
  buildTestContext,
  renderPdf,
  textOf,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { buildTestChantier } from "@/server/rapport-detaille/testData";

const chantier = buildTestChantier({
  nom: "Réduire les délais",
  ecart: -12.34,
  tendance: "BAISSE",
  avancementPrecedent: 41.6,
  dateTauxAvancementMandatValeurPrecedente: "2026-03-15T00:00:00Z",
  responsables: {
    porteur: null,
    coporteurs: [],
    directeursAdminCentrale: [],
    directeursProjet: [
      { nom: "Jeanne Martin", email: "j@x.fr", service: null, fonction: null },
      { nom: "Paul Durand", email: null, service: null, fonction: null },
    ],
  },
});

describe("chantierPdf", () => {
  it("affiche en national le nom, l'avancement France et la répartition", async () => {
    const content = chantierPdf({
      chantier,
      detail: buildTestChantierDetail(),
      context: buildTestContext(),
    });

    const text = textOf(content);
    expect(text).toContain("Réduire les délais");
    expect(text).toContain("Avancement du chantier");
    expect(text).toContain("France");
    expect(text).toContain("Taux d'avancement national");
    expect(text).toContain("55%");
    expect(text).toContain(
      "Répartition territoriale du taux d'avancement 2026",
    );
    expect(text).toContain("Répartition départementale");
    expect(text).toContain("Maximum");
    expect(text).toContain("Données de comparaison de l'avancement 2026");
    expect(text).toContain("EVOLUTION TEMPORELLE");
    expect(text).toContain("EN BAISSE");
    expect(text).toContain("42%");
    expect(text).toContain("03/2026");
    expect(text).not.toContain("SITUATION PAR RAPPORT AUX AUTRES");
    expect(text).toContain("Directeur(s) / directrice(s) du projet");
    expect(text).toContain("Jeanne Martin, Paul Durand");
    expect(text).not.toContain("Responsable local");
    expect(await renderPdf(content)).toBe("%PDF");
  });

  it("affiche en départemental les blocs département et région, l'écart et les responsables locaux", () => {
    const text = textOf(
      chantierPdf({
        chantier: { ...chantier, avancementPrecedent: null },
        detail: buildTestChantierDetail(),
        context: buildTestContext({}, "DEPT-75"),
      }),
    );

    expect(text).toContain("75 - Paris");
    expect(text).toContain("Taux d'avancement départemental");
    expect(text).toContain("Île-de-France");
    expect(text).toContain("Taux d'avancement régional");
    expect(text).toContain("SITUATION PAR RAPPORT AUX AUTRES DÉPARTEMENTS");
    expect(text).toContain("EN RETARD : -12.3");
    expect(text).toContain(
      "par rapport au taux médian des autres départements",
    );
    expect(text).toContain("45%");
    expect(text).toContain("(Non défini)");
    expect(text).toContain("Responsable local");
    expect(text).toContain("Coordinateur PILOTE departemental");
    expect(text).toContain("Non renseigné");
  });

  it("affiche la météo non renseignée sans synthèse", () => {
    const text = textOf(
      chantierPdf({
        chantier,
        detail: buildTestChantierDetail(),
        context: buildTestContext(),
      }),
    );

    expect(text).toContain("Météo et synthèse des résultats");
    expect(text).toContain("NON RENSEIGNÉE");
    expect(text).toContain("Aucune synthèse des résultats.");
  });

  it("affiche la synthèse avec sa date et son auteur", () => {
    const text = textOf(
      chantierPdf({
        chantier,
        detail: buildTestChantierDetail({
          synthèseDesRésultats: {
            id: "S1",
            contenu: "<p>Bonne dynamique</p>",
            date: "2026-09-15T10:00:00Z",
            auteur: "Jeanne Martin",
            météo: "SOLEIL",
          },
        }),
        context: buildTestContext(),
      }),
    );

    expect(text).toContain("OBJECTIFS SÉCURISÉS");
    expect(text).toContain("Mis à jour le 15/09/2026 | Par Jeanne Martin");
    expect(text).toContain("Bonne dynamique");
  });
});
