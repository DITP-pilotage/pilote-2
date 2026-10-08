import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { cartesPdf } from "@/server/rapport-detaille/pdf/cartes";
import {
  commentairesPdf,
  decisionsPdf,
  objectifsPdf,
} from "@/server/rapport-detaille/pdf/publications";
import { indicateursPdf } from "@/server/rapport-detaille/pdf/indicateurs";
import {
  buildTestChantierDetail,
  buildTestContext,
  renderPdf,
  textOf,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { buildTestChantier } from "@/server/rapport-detaille/testData";

function buildIndicateur(overrides: Partial<Indicateur>): Indicateur {
  return {
    id: "IND",
    nom: "Indicateur",
    type: "IMPACT",
    estIndicateurDuBaromètre: false,
    description: null,
    source: null,
    modeDeCalcul: null,
    unité: null,
    parentId: null,
    periodicite: null,
    delaiDisponibilite: null,
    responsablesDonneesMails: [],
    mailleNatAgregee: false,
    mailleRegAgregee: false,
    ...overrides,
  };
}

function buildDétails(
  overrides: Partial<DétailsIndicateur>,
): DétailsIndicateur {
  return {
    codeInsee: "FR",
    valeurInitiale: 10,
    dateValeurInitiale: "2023-01-15T00:00:00Z",
    historiquesValeurs: [],
    valeurAvancementMandat: null,
    valeurAvancement: 1234.5,
    dateValeurAvancement: "2026-06-15T00:00:00Z",
    dateValeurAvancementMandat: null,
    valeurCible: null,
    dateValeurCible: null,
    valeurCibleAnnuelle: 80,
    dateValeurCibleAnnuelle: "2026-12-31T00:00:00Z",
    avancement: { annuel: 42.4, global: 30 },
    proposition: null,
    propositionStatutTerritoire: null,
    propositionStatutDirectionProjet: null,
    unite: null,
    estApplicable: true,
    dateImport: "2026-07-01T00:00:00Z",
    ponderation: null,
    prochaineDateValeurAvancement: null,
    prochaineDateMaj: null,
    prochaineDateMajJours: null,
    estAJour: null,
    tendance: null,
    listeValeursCiblesAnnuelles: [],
    ...overrides,
  };
}

describe("cartesPdf", () => {
  it("n'affiche rien pour un chantier sans donnée territorialisée", () => {
    expect(
      cartesPdf({
        chantier: buildTestChantier(),
        detail: buildTestChantierDetail(),
        context: buildTestContext(),
      }),
    ).toBeNull();
  });

  it("affiche les deux cartes d'un chantier territorialisé", async () => {
    const content = cartesPdf({
      chantier: buildTestChantier({ estTerritorialisé: true }),
      detail: buildTestChantierDetail({
        donnéesCartographieMétéo: [
          { valeur: "SOLEIL", territoireCode: "DEPT-75", estApplicable: false },
        ],
      }),
      context: buildTestContext(),
    });

    const text = textOf(content ?? "");
    expect(text).toContain("Répartition géographique");
    expect(text).toContain("Taux d'avancement 2026");
    expect(text).toContain("Niveau de confiance");
    expect(text).toContain("Objectifs sécurisés");
    expect(text).toContain(
      "Territoire où le chantier prioritaire ne s'applique pas",
    );
    expect(await renderPdf(content ?? "")).toBe("%PDF");
  });
});

describe("publications", () => {
  it("affiche les trois objectifs, renseignés ou non", async () => {
    const content = objectifsPdf([
      {
        id: "O1",
        contenu: "<p>Ambition forte</p>",
        date: "2026-09-15T22:30:00Z",
        auteur: "Jeanne Martin",
        type: "notreAmbition",
      },
    ]);

    const text = textOf(content ?? "");
    expect(text).toContain("Objectifs");
    expect(text).toContain("National");
    expect(text).toContain("Notre ambition");
    expect(text).toContain("Mis à jour le 16/09/2026 | Par Jeanne Martin");
    expect(text).toContain("Ambition forte");
    expect(text).toContain("Ce qui a déjà été fait");
    expect(text).toContain("NON RENSEIGNÉ");
    expect(await renderPdf(content ?? "")).toBe("%PDF");
  });

  it("n'affiche pas les objectifs s'il n'y en a aucun", () => {
    expect(objectifsPdf([])).toBeNull();
  });

  it("affiche les quatre rubriques de commentaires en national et deux ailleurs", () => {
    const national = textOf(commentairesPdf([], buildTestContext()) ?? "");
    const départemental = textOf(
      commentairesPdf([], buildTestContext({}, "DEPT-75")) ?? "",
    );

    expect(national).toContain("Commentaires du chantier");
    expect(national).toContain("Risques et freins à lever");
    expect(national).toContain("Exemples concrets de réussite");
    expect(départemental).toContain("75 - Paris");
    expect(départemental).toContain("Commentaires sur les données");
    expect(départemental).not.toContain("Risques et freins à lever");
  });

  it("n'affiche les décisions stratégiques qu'en national", () => {
    const décision = {
      id: "D",
      contenu: "<p>Décision</p>",
      date: "2026-09-15T10:00:00Z",
      auteur: "Jeanne Martin",
      type: "suiviDesDecisionsStrategiques" as const,
    };

    expect(textOf(decisionsPdf(décision, buildTestContext()) ?? "")).toContain(
      "Suivi des décisions stratégiques",
    );
    expect(decisionsPdf(décision, buildTestContext({}, "DEPT-75"))).toBeNull();
    expect(decisionsPdf(null, buildTestContext())).toBeNull();
  });
});

describe("indicateursPdf", () => {
  it("répartit les indicateurs par rubrique et détaille chacun", async () => {
    const indicateurs = [
      buildIndicateur({
        id: "A",
        nom: "Délai moyen",
        unité: "Jours",
        estIndicateurDuBaromètre: true,
      }),
      buildIndicateur({
        id: "B",
        nom: "Taux de couverture",
        unité: "Pourcentage",
      }),
      buildIndicateur({ id: "C", nom: "Nombre de sites", unité: "" }),
    ];
    const content = indicateursPdf({
      indicateurs,
      détailsIndicateurs: {
        A: {
          "NAT-FR": buildDétails({ ponderation: 12.5, tendance: "BAISSE" }),
        },
        B: { "NAT-FR": buildDétails({ ponderation: 0, unite: "Pourcentage" }) },
        C: { "NAT-FR": buildDétails({ ponderation: null, dateImport: null }) },
      },
      listeIndicateursPrisEnCompteAvancement: ["B"],
      context: buildTestContext(),
      hideNonApplicable: false,
    });

    const text = textOf(content ?? "");
    expect(text).toContain("Indicateurs");
    expect(text).toContain(
      "Indicateurs pris en compte dans le taux d'avancement du territoire (1)",
    );
    expect(text).toContain("Délai moyen (en jours)");
    expect(text).toContain(
      "Cet indicateur représente 12.5% du taux d'avancement national du chantier.",
    );
    expect(text).toContain(
      "Attention, cet indicateur a un objectif de baisse.",
    );
    expect(text).toContain(
      "Indicateurs non pris en compte dans le taux d'avancement du territoire et/ou de la maille (1)",
    );
    expect(text).toContain("Taux de couverture (en pourcentage)");
    expect(text).toContain(
      "Cet indicateur n'est pas pris en compte dans le taux d'avancement national du chantier.",
    );
    expect(text).toContain("Autres indicateurs (1)");
    expect(text).toContain("Nombre de sites ");
    expect(text).toContain(
      "La pondération n'est pas disponible pour le taux d'avancement national.",
    );
    expect(text).toContain("Non renseigné");
    expect(text).toContain(
      "Territoire(s) Valeur initiale Valeur actuelle Cible 2026 Avancement 2026",
    );
    expect(text).toContain("(06/2026)");
    expect(text).toContain("42 %");
    expect(await renderPdf(content ?? "")).toBe("%PDF");
  });

  it("affiche une alerte quand aucun indicateur n'est applicable", () => {
    const text = textOf(
      indicateursPdf({
        indicateurs: [buildIndicateur({ id: "A" })],
        détailsIndicateurs: {
          A: { "NAT-FR": buildDétails({ estApplicable: false }) },
        },
        listeIndicateursPrisEnCompteAvancement: [],
        context: buildTestContext(),
        hideNonApplicable: true,
      }) ?? "",
    );

    expect(text).toContain(
      "Aucun indicateur n'est applicable pour le territoire sélectionné",
    );
  });

  it("n'affiche rien sans indicateur", () => {
    expect(
      indicateursPdf({
        indicateurs: [],
        détailsIndicateurs: {},
        listeIndicateursPrisEnCompteAvancement: [],
        context: buildTestContext(),
        hideNonApplicable: false,
      }),
    ).toBeNull();
  });
});
