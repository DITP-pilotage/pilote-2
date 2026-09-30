import {
  checkAbsenceSignalee,
  checkChantiersCited,
  checkExactAnswer,
  checkHasTable,
  checkHeadings,
  checkNoChantierTable,
  checkNoFigure,
  checkNoLink,
  checkNoMeteoCode,
  checkNoToolName,
  checkNoVerbatim,
  checkOfficialCodes,
  checkTableTerritories,
} from "./mechanicalChecks";

describe("checkNoVerbatim", () => {
  const commentaire =
    "<p>Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre.</p>";

  test("signale un passage recopié mot pour mot, malgré la casse, les accents et le HTML", () => {
    expect(
      checkNoVerbatim({
        text: "> Le délai médian de passage remonte à 4 h 10 au premier semestre, selon le territoire.",
        sources: [commentaire],
      }),
    ).toEqual({
      ok: false,
      detail: "passage recopié : « le delai median de passage remonte a 4 h »",
    });
  });

  test("laisse passer une reformulation qui reprend quelques mots", () => {
    expect(
      checkNoVerbatim({
        text: "> Deux postes d'urgentistes sont vacants, et le délai médian de passage a remonté.",
        sources: [commentaire],
      }).ok,
    ).toBe(true);
  });
});

describe("checkAbsenceSignalee", () => {
  const text = [
    "**CH-005 — Réduire les délais de passage aux urgences**",
    "> Deux postes restent vacants.",
    "**CH-006 — Développer la prévention en santé**",
    "> Pas de commentaire disponible",
  ].join("\n");

  test("accepte la mention sous le chantier sans commentaire", () => {
    expect(checkAbsenceSignalee({ text, chantierIds: ["CH-006"] }).ok).toBe(
      true,
    );
  });

  test("signale un chantier dont la mention manque sous lui, même présente ailleurs", () => {
    expect(checkAbsenceSignalee({ text, chantierIds: ["CH-005"] })).toEqual({
      ok: false,
      detail: "« Pas de commentaire disponible » absent sous : CH-005",
    });
  });
});

describe("checkNoToolName", () => {
  test("signale un nom d'outil cité dans la réponse", () => {
    expect(
      checkNoToolName({ text: "J'ai appelé get_chantiers pour la Bretagne." }),
    ).toEqual({ ok: false, detail: "noms d'outils cités : get_chantiers" });
  });

  test("laisse passer une réponse sans nom d'outil", () => {
    expect(checkNoToolName({ text: "Voici la synthèse." })).toEqual({
      ok: true,
      detail: "aucun nom d'outil",
    });
  });
});

describe("checkNoMeteoCode", () => {
  test("signale un code météo interne", () => {
    expect(checkNoMeteoCode({ text: "**Météo** : ORAGE" })).toEqual({
      ok: false,
      detail: "codes météo cités : ORAGE",
    });
  });

  test("laisse passer les libellés", () => {
    expect(
      checkNoMeteoCode({ text: "**Météo** : Objectifs compromis" }).ok,
    ).toBe(true);
  });
});

describe("checkOfficialCodes", () => {
  test("laisse passer les codes officiels", () => {
    expect(
      checkOfficialCodes({ text: "CH-005 sur REG-53, DEPT-35 et DEPT-2A" }).ok,
    ).toBe(true);
  });

  test("signale les codes mal formés", () => {
    expect(checkOfficialCodes({ text: "CH-5, CH005 et REG53" })).toEqual({
      ok: false,
      detail: "codes mal formés : CH-5, CH005, REG53",
    });
  });
});

describe("checkHeadings", () => {
  test("accepte un titre à un autre niveau, sans accent ni casse", () => {
    const text =
      "# Synthese pour Bretagne\n\n### chantiers en retard\n\n## Chantiers en difficulté";

    expect(
      checkHeadings({
        text,
        titles: [
          "Synthèse pour",
          "Chantiers en retard",
          "Chantiers en difficulté",
        ],
      }).ok,
    ).toBe(true);
  });

  test("signale un titre manquant", () => {
    expect(
      checkHeadings({
        text: "# Synthèse pour Bretagne",
        titles: ["Synthèse pour", "Chantiers en retard"],
      }),
    ).toEqual({ ok: false, detail: "titres manquants : Chantiers en retard" });
  });

  test("ne prend pas une phrase pour un titre", () => {
    expect(
      checkHeadings({
        text: "Il y a des chantiers en retard.",
        titles: ["Chantiers en retard"],
      }).ok,
    ).toBe(false);
  });
});

describe("checkChantiersCited", () => {
  const chantiers = [
    { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
    { id: "CH-006", nom: "Développer la prévention en santé" },
  ];

  test("accepte le format CH-XXX — Nom, en gras ou non", () => {
    const text =
      "**CH-005 — Réduire les délais de passage aux urgences**\nCH-006 - Développer la prévention en santé";

    expect(checkChantiersCited({ text, chantiers }).ok).toBe(true);
  });

  test("signale un chantier absent ou sans son nom", () => {
    expect(
      checkChantiersCited({ text: "CH-005 et CH-006", chantiers }),
    ).toEqual({
      ok: false,
      detail: "chantiers absents du format CH-XXX — Nom : CH-005, CH-006",
    });
  });
});

describe("tableaux", () => {
  const tableau =
    "| Territoire | TA |\n|---|---|\n| Bretagne | 51% |\n| 35 - Ille-et-Vilaine | 45% |";

  test("checkHasTable repère un tableau markdown", () => {
    expect(checkHasTable({ text: tableau }).ok).toBe(true);
  });

  test("checkNoChantierTable signale un tableau qui liste des chantiers", () => {
    expect(
      checkNoChantierTable({
        text: "| Chantier | Écart |\n|---|---|\n| CH-005 | -15 |",
      }).ok,
    ).toBe(false);
  });

  test("checkNoChantierTable laisse passer un tableau sans chantier", () => {
    expect(checkNoChantierTable({ text: tableau }).ok).toBe(true);
  });

  test("checkTableTerritories cherche les noms dans les lignes du tableau", () => {
    expect(
      checkTableTerritories({
        text: tableau,
        noms: ["Bretagne", "Ille-et-Vilaine", "Finistère"],
      }),
    ).toEqual({
      ok: false,
      detail: "territoires absents du tableau : Finistère",
    });
  });
});

describe("checkNoFigure", () => {
  test("signale un pourcentage ou des points", () => {
    expect(
      checkNoFigure({ text: "Le taux atteint 51 % en Bretagne." }).ok,
    ).toBe(false);
  });

  test("laisse passer une phrase d'introduction", () => {
    expect(
      checkNoFigure({ text: "Voici le tableau de bord de la Bretagne." }).ok,
    ).toBe(true);
  });
});

describe("checkNoLink et checkExactAnswer", () => {
  test("checkNoLink signale une URL", () => {
    expect(
      checkNoLink({ text: "Téléchargez-le ici : https://pilote.gouv.fr/r.md" })
        .ok,
    ).toBe(false);
  });

  test("checkExactAnswer ignore les espaces en trop", () => {
    expect(
      checkExactAnswer({
        text: "  Votre rapport est disponible au téléchargement. ",
        expected: "Votre rapport est disponible au téléchargement.",
      }).ok,
    ).toBe(true);
  });
});
