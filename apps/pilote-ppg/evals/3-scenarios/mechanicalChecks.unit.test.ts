import {
  checkEncartChantiers,
  checkMailleNommee,
  checkRestrictionEncart,
  checkChantierFormat,
  checkChantiersCited,
  checkDashboardNonVide,
  checkExactAnswer,
  checkFrench,
  checkHasTable,
  checkNoLink,
  checkNoHtml,
  checkNoMeteo,
  checkNoMeteoCode,
  checkNoVerbatim,
  checkNoToolName,
  checkSectionsDashboard,
  checkTableChantiers,
  checkTableTerritories,
  checkVerbatim,
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

describe("checkFrench", () => {
  test("signale la phrase anglaise observée après une clarification (PIL-1900, F2)", () => {
    expect(
      checkFrench({
        text: "I'm waiting for your choice. Please select one of the options above.",
      }),
    ).toEqual({
      ok: false,
      detail: "mots anglais : i'm, waiting, your, please, select, the, above",
    });
  });

  test("laisse passer la phrase de clôture française", () => {
    expect(
      checkFrench({ text: "Choisissez une option pour continuer." }),
    ).toEqual({ ok: true, detail: "réponse en français" });
  });

  test("ne confond pas un mot anglais avec un mot français qui le contient", () => {
    expect(checkFrench({ text: "Un thème, un thé et une option." }).ok).toBe(
      true,
    );
  });
});

describe("checkTableChantiers", () => {
  const tableau =
    "| Chantier | Écart |\n|---|---|\n| CH‑005 — Urgences | -14 |";

  test("trouve un chantier dans une ligne du tableau, quel que soit le tiret", () => {
    expect(
      checkTableChantiers({ text: tableau, chantierIds: ["CH-005"] }),
    ).toEqual({ ok: true, detail: "chantiers dans le tableau" });
  });

  test("signale un chantier cité hors du tableau", () => {
    expect(
      checkTableChantiers({
        text: `${tableau}\n\nCH-006 est aussi concerné.`,
        chantierIds: ["CH-005", "CH-006"],
      }),
    ).toEqual({ ok: false, detail: "chantiers absents du tableau : CH-006" });
  });
});

describe("checkVerbatim", () => {
  const source =
    "<p>Deux postes d'urgentistes sont vacants à Brest et Quimper.</p><p>Le délai médian de passage a remonté au premier semestre.</p>";

  test("reconnaît un commentaire restitué sur deux paragraphes", () => {
    expect(
      checkVerbatim({
        text: "Deux postes d'urgentistes sont vacants à Brest et Quimper.\n\nLe délai médian de passage a remonté au premier semestre.",
        sources: [source],
      }),
    ).toEqual({ ok: true, detail: "commentaires restitués" });
  });

  test("signale un commentaire résumé", () => {
    expect(
      checkVerbatim({
        text: "Des postes vacants et des délais en hausse.",
        sources: [source],
      }).ok,
    ).toBe(false);
  });
});

describe("checkDashboardNonVide", () => {
  const titre = { type: "widget_titre_section" };
  const paragraphe = { type: "widget_paragraph" };

  test("laisse passer l'absence de dashboard", () => {
    expect(checkDashboardNonVide({ dashboard: null })).toEqual({
      ok: true,
      detail: "aucun dashboard composé",
    });
  });

  test("signale un dashboard fait seulement de titres et de paragraphes", () => {
    expect(
      checkDashboardNonVide({
        dashboard: {
          containers: [{ widgets: [titre] }, { widgets: [paragraphe] }],
        },
      }),
    ).toEqual({ ok: false, detail: "dashboard sans widget de données" });
  });

  test("laisse passer un dashboard qui affiche une donnée", () => {
    expect(
      checkDashboardNonVide({
        dashboard: {
          containers: [
            { widgets: [titre] },
            { widgets: [{ type: "widget_taux_avancement_territoire" }] },
          ],
        },
      }).ok,
    ).toBe(true);
  });
});

describe("checkNoMeteo", () => {
  test("signale la météo citée, avec ou sans accents (PIL-1900, D1)", () => {
    expect(
      checkNoMeteo({ text: "CH-005 — Urgences : météo Appuis nécessaires." }),
    ).toEqual({ ok: false, detail: "météo citée" });
    expect(checkNoMeteo({ text: "**Meteo** : Objectifs compromis" }).ok).toBe(
      false,
    );
  });

  test("laisse passer le niveau de confiance en libellé", () => {
    expect(
      checkNoMeteo({
        text: "CH-005 — Urgences : niveau de confiance « Appuis nécessaires ».",
      }),
    ).toEqual({ ok: true, detail: "aucune mention de la météo" });
  });
});

describe("checkNoHtml", () => {
  test("signale une balise que le chat afficherait en texte brut", () => {
    expect(
      checkNoHtml({
        text: "| Freins | • Postes vacants.<br>• Fermeture de lignes. |",
      }),
    ).toEqual({ ok: false, detail: "balises HTML : <br>" });
  });

  test("laisse passer le markdown, les comparaisons et les flèches", () => {
    expect(
      checkNoHtml({
        text: "**CH-005** : écart < -10 points, 34 % -> 40 %. Voir <https://exemple.fr>.",
      }),
    ).toEqual({ ok: true, detail: "aucune balise HTML" });
  });
});

const chantierDonne = ({
  id,
  ecart,
  niveau,
}: {
  id: string;
  ecart: number;
  niveau: string;
}) => ({
  chantier: { id },
  ecart,
  niveau_de_confiance: niveau,
  synthese: { commentaire: null },
});

describe("checkEncartChantiers", () => {
  const chantiers = [
    chantierDonne({ id: "CH-071", ecart: -14.4, niveau: "Appuis nécessaires" }),
  ];

  test("retrouve chaque chantier avec son écart arrondi et son niveau de confiance", () => {
    expect(
      checkEncartChantiers({
        text: "**CH-071 — Rénover**\n**Écart** : −14 points · **Niveau de confiance** : Appuis nécessaires",
        chantiers,
        avecEcart: true,
      }),
    ).toEqual({ ok: true, detail: "1 chantier(s) conforme(s)" });
  });

  test("signale un écart faux ou un chantier absent", () => {
    expect(
      checkEncartChantiers({
        text: "**CH-071 — Rénover**\n**Écart** : −12 points · **Niveau de confiance** : Appuis nécessaires",
        chantiers: [
          ...chantiers,
          chantierDonne({
            id: "CH-045",
            ecart: 2,
            niveau: "Objectifs compromis",
          }),
        ],
        avecEcart: true,
      }),
    ).toEqual({
      ok: false,
      detail: "CH-071 : écart -14 absent ; CH-045 : absent",
    });
  });
});

describe("checkMailleNommee", () => {
  test("un département n'est pas nommé « la région »", () => {
    expect(
      checkMailleNommee({
        text: "Dans PILOTE, le taux d'avancement 2025 de la région s'établit à 54 %.",
        territoireCode: "DEPT-59",
      }),
    ).toEqual({
      ok: false,
      detail: "maille écrite « de la region », attendue « du departement »",
    });
  });

  test("une région est nommée « la région »", () => {
    expect(
      checkMailleNommee({
        text: "Dans PILOTE, le taux d'avancement 2025 de la région s'établit à 54 %.",
        territoireCode: "REG-53",
      }),
    ).toEqual({ ok: true, detail: "maille « de la region »" });
  });
});

describe("checkRestrictionEncart", () => {
  const resultats = [
    {
      territoire_code: "REG-52",
      acces_restreint: true,
      chantiers: [
        { chantier: { id: "CH-071" }, synthese: { commentaire: null } },
      ],
    },
  ];

  test("exige la mention de la restriction quand des commentaires sont masqués", () => {
    expect(
      checkRestrictionEncart({
        text: "> Pas de commentaire disponible",
        resultats,
      }),
    ).toEqual({
      ok: false,
      detail: "commentaires masqués sans la mention de la restriction d'accès",
    });
  });

  test("accepte la mention de la restriction", () => {
    expect(
      checkRestrictionEncart({
        text: "> Commentaire non accessible (restriction d'accès)",
        resultats,
      }),
    ).toEqual({ ok: true, detail: "restriction d'accès mentionnée" });
  });
});
