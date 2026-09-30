import {
  checkAbsenceSignalee,
  checkChantiersCited,
  checkContains,
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
  checkResumesCourts,
  checkSectionsDashboard,
  checkTableTerritories,
} from "./mechanicalChecks";

describe("checkSectionsDashboard", () => {
  const titre = (texte: string) => ({
    type: "widget_titre_section",
    titre: texte,
  });
  const meteo = (chantier_id: string) => ({
    type: "widget_cartographie_meteo",
    chantier_id,
  });
  const taux = {
    type: "widget_taux_avancement_territoire",
    territoire_code: "REG-53",
  };

  test("découpe les sections aux titres, pas aux conteneurs (structure du run du 30/09)", () => {
    const containers = [
      { widgets: [titre("Bretagne")] },
      { widgets: [taux] },
      { widgets: [titre("CH-005 — Urgences")] },
      { widgets: [meteo("CH-005")] },
      { widgets: [titre("CH-006 — Prévention")] },
      { widgets: [meteo("CH-006")] },
    ];

    expect(
      checkSectionsDashboard({ containers, chantierIds: ["CH-005", "CH-006"] }),
    ).toEqual({
      ok: true,
      detail: "une section par chantier : CH-005, CH-006",
    });
  });

  test("sans titre de section, chaque conteneur est une section", () => {
    const containers = [
      { widgets: [taux] },
      { widgets: [meteo("CH-005")] },
      { widgets: [meteo("CH-006")] },
    ];

    expect(
      checkSectionsDashboard({ containers, chantierIds: ["CH-005", "CH-006"] })
        .ok,
    ).toBe(true);
  });

  test("signale une section qui mélange deux chantiers", () => {
    const containers = [
      { widgets: [taux] },
      { widgets: [meteo("CH-005"), meteo("CH-006")] },
    ];

    expect(
      checkSectionsDashboard({ containers, chantierIds: ["CH-005", "CH-006"] }),
    ).toEqual({
      ok: false,
      detail: "sections chantier : CH-005+CH-006, attendu CH-005, CH-006",
    });
  });

  test("signale une première section qui porte sur un chantier", () => {
    expect(
      checkSectionsDashboard({
        containers: [{ widgets: [meteo("CH-005")] }],
        chantierIds: ["CH-005"],
      }),
    ).toEqual({
      ok: false,
      detail: "la première section porte sur un chantier",
    });
  });
});

describe("typographie d'Albert", () => {
  // Run du 30/09 : Albert écrit « CH‑005 » (trait d'union insécable U+2011),
  // « Côtes‑d’Armor » (apostrophe U+2019) et « 46 % » (espace fine U+202F).
  // Sans normalisation, ces réponses échouaient des critères qu'elles
  // respectaient.
  const tableau =
    "| Territoire | TA |\n|---|---|\n| DEPT‑22 – Côtes‑d’Armor | 46 % |\n| DEPT‑35 – Ille‑et‑Vilaine | 46 % |";

  test("retrouve les territoires écrits avec des traits d'union insécables et une apostrophe courbe", () => {
    expect(
      checkTableTerritories({
        text: tableau,
        noms: ["Côtes-d'Armor", "Ille-et-Vilaine"],
      }).ok,
    ).toBe(true);
  });

  test("retrouve un chantier cité avec un trait d'union insécable", () => {
    expect(
      checkChantiersCited({
        text: "**CH‑005 — Réduire les délais de passage aux urgences**",
        chantiers: [
          { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
        ],
      }).ok,
    ).toBe(true);
  });

  test("tient un code à trait d'union insécable pour un code officiel", () => {
    expect(checkOfficialCodes({ text: "CH‑005 sur REG‑53" }).ok).toBe(true);
  });

  test("délimite la section d'un chantier cité avec un trait d'union insécable", () => {
    expect(
      checkAbsenceSignalee({
        text: "**CH‑005 — Urgences**\n> Deux postes.\n**CH‑006 — Prévention**\n> Pas de commentaire disponible",
        chantierIds: ["CH-006"],
      }).ok,
    ).toBe(true);
  });

  test("tolère un tiret demi-cadratin ou court à la place du cadratin (revue du 30/09)", () => {
    expect([
      checkContains({
        text: "**Synthèse – chantiers en retard** : un chantier.",
        fragments: ["Synthèse — chantiers en retard"],
      }),
      checkContains({
        text: "**Synthèse - chantiers en retard** : un chantier.",
        fragments: ["Synthèse — chantiers en retard"],
      }),
    ]).toEqual([
      { ok: true, detail: "mentions présentes" },
      { ok: true, detail: "mentions présentes" },
    ]);
  });

  test("signale un code officiel écrit avec un tiret demi-cadratin", () => {
    expect(checkOfficialCodes({ text: "CH–5 sur REG–53" })).toEqual({
      ok: false,
      detail: "codes mal formés : CH-5",
    });
  });

  test("repère un tableau de chantiers écrit avec un trait d'union insécable", () => {
    expect(
      checkNoChantierTable({ text: "| Chantier |\n|---|\n| CH‑005 |" }).ok,
    ).toBe(false);
  });
});

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

describe("checkResumesCourts", () => {
  test("accepte des résumés d'une ou deux phrases sous les chantiers", () => {
    expect(
      checkResumesCourts({
        text: "**CH-005 — Urgences**\n> Deux postes sont vacants. Le délai remonte à 4 h 10.\n\n**CH-006 — Prévention**\n> Pas de commentaire disponible",
      }).ok,
    ).toBe(true);
  });

  test("signale un résumé de plus de deux phrases", () => {
    expect(
      checkResumesCourts({
        text: "> Deux postes sont vacants. La situation pèse. Le délai remonte.",
      }),
    ).toEqual({
      ok: false,
      detail:
        "résumé de 3 phrases : « Deux postes sont vacants. La situation pèse. Le délai remonte. »",
    });
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

  test("checkExactAnswer ignore la ponctuation finale (revue du 30/09)", () => {
    expect(
      checkExactAnswer({
        text: "Votre rapport est disponible au téléchargement",
        expected: "Votre rapport est disponible au téléchargement.",
      }),
    ).toEqual({ ok: true, detail: "réponse attendue" });
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
