import {
  checkAbsenceSignalee,
  checkChantierFormat,
  checkChantiersCited,
  checkExactAnswer,
  checkHasTable,
  checkNoLink,
  checkNoMeteoCode,
  checkNoVerbatim,
  checkNoToolName,
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

  test("délimite la section d'un chantier cité avec un trait d'union insécable", () => {
    expect(
      checkAbsenceSignalee({
        text: "**CH‑005 — Urgences**\n> Deux postes.\n**CH‑006 — Prévention**\n> Pas de commentaire disponible",
        chantierIds: ["CH-006"],
      }).ok,
    ).toBe(true);
  });
});

describe("checkNoVerbatim", () => {
  const commentaire =
    "<p>Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre.</p>";

  test("signale un commentaire repris en entier, malgré la casse, les accents et le HTML", () => {
    expect(
      checkNoVerbatim({
        text: "**CH-005 — Urgences**\n> DEUX POSTES D'URGENTISTES restent vacants a Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre.",
        sources: [commentaire],
      }).ok,
    ).toBe(false);
  });

  test("signale un commentaire repris pour l'essentiel, à quelques mots près", () => {
    expect(
      checkNoVerbatim({
        text: "> Deux postes d'urgentistes restent vacants à Brest et Quimper, et le délai médian de passage remonte à 4 h 10 au premier semestre.",
        sources: [commentaire],
      }).ok,
    ).toBe(false);
  });

  test("laisse passer un résumé qui reprend des expressions courtes", () => {
    expect(
      checkNoVerbatim({
        text: "> Deux postes restent vacants et le délai médian de passage s'allonge.",
        sources: [commentaire],
      }),
    ).toEqual({ ok: true, detail: "aucun commentaire recopié" });
  });

  test("ne recompose pas un commentaire à partir de paragraphes distincts", () => {
    expect(
      checkNoVerbatim({
        text: "Deux postes d'urgentistes restent vacants à Brest et Quimper.\n\nAilleurs, le délai médian de passage remonte à 4 h 10 au premier semestre.",
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

describe("checkChantierFormat", () => {
  test("accepte un chantier cité une fois au format CH-XXX — Nom, puis par son code", () => {
    expect(
      checkChantierFormat({
        text: "**CH-005 — Réduire les délais de passage aux urgences**\nPlus loin, CH-005 reste en retard.",
      }).ok,
    ).toBe(true);
  });

  test("signale un chantier jamais suivi de son nom", () => {
    expect(
      checkChantierFormat({
        text: "**CH-005 — Réduire les délais de passage aux urgences**, puis CH-006 et CH-006.",
      }),
    ).toEqual({
      ok: false,
      detail: "chantiers cités sans leur nom : CH-006",
    });
  });

  test("accepte un trait d'union insécable et un tiret court", () => {
    expect(
      checkChantierFormat({ text: "CH‑005 – Réduire les délais" }).ok,
    ).toBe(true);
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
