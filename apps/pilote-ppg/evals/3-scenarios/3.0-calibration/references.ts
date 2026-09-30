import type {
  ComposeDashboardOutput,
  WidgetDefinition,
} from "@/server/albert/tools/composeDashboard";
import type { Evidence } from "../evidence";
import type { GRIDS } from "../grids";
import type { GroundTruth } from "../truth";

/**
 * Les cas de la calibration du juge : pour chaque famille jugée, une réponse
 * de référence conforme à tous les critères jugés, et un mutant par critère,
 * qui casse ce critère et lui seul (nommé dans `broken`).
 *
 * Les références passent aussi tous les critères mécaniques de leur grille :
 * `references.unit.test.ts` le vérifie. Sans ça, un mutant ne casserait pas
 * « un seul critère ».
 */

export type CalibrationCase = {
  family: keyof typeof GRIDS;
  label: string;
  /** Identifiant du critère cassé ; `null` pour la référence. */
  broken: string | null;
  evidence: Evidence;
};

const CH_005 = {
  id: "CH-005",
  nom: "Réduire les délais de passage aux urgences",
};
const CH_006 = { id: "CH-006", nom: "Développer la prévention en santé" };

const chantier = ({
  id,
  nom,
  ecart,
  meteo,
  commentaire,
}: {
  id: string;
  nom: string;
  ecart: number;
  meteo: string;
  commentaire: string | null;
}) => ({
  chantier: {
    id,
    nom,
    axe: "non renseigné",
    ppg: "non renseignée",
    ministeres: [],
    mailles_applicables: ["NAT", "REG", "DEPT"],
  },
  meteo,
  tendance: null,
  ecart,
  taux_avancement: null,
  est_en_retard: ecart <= -10,
  est_en_difficulte: ecart > -10,
  synthese: { meteo, commentaire, date_meteo: null, date_commentaire: null },
  commentaires: { donnees: null, autresResultats: null },
});

/** Une fiche figée pour la Bretagne, calquée sur le monde territorial. */
const FICHE_BRETAGNE: GroundTruth = {
  territoires: [{ code: "REG-53", nom: "Bretagne", maille: "REG" }],
  tauxAvancement: [
    {
      territoire_code: "REG-53",
      jalon: 2025,
      taux_avancement_global: "51%",
      mediane_repartition: "65%",
      position_mediane: "EN_RETARD",
    },
  ],
  chantiersEnRetard: [
    {
      territoire_code: "REG-53",
      territoire_nom: "Bretagne",
      jalon: 2025,
      chantiers: [
        chantier({
          ...CH_005,
          ecart: -15,
          meteo: "NUAGE",
          commentaire:
            "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
        }),
      ],
    },
  ],
  chantiersEnDifficulte: [
    {
      territoire_code: "REG-53",
      territoire_nom: "Bretagne",
      jalon: 2025,
      chantiers: [
        chantier({ ...CH_006, ecart: 2, meteo: "ORAGE", commentaire: null }),
      ],
    },
  ],
  indicateurs: [
    {
      territoire_code: "REG-53",
      chantier_id: "CH-005",
      indicateurs: [
        {
          indicateur_id: "IND-005",
          nom: "Délai médian de passage aux urgences",
          unite_mesure: null,
          valeur_initiale: 280,
          date_valeur_initiale: null,
          valeur_actuelle: 250,
          date_valeur_actuelle: null,
          valeur_cible: 180,
          date_valeur_cible: null,
          taux_avancement: 30,
        },
      ],
    },
  ],
  commentaires: [],
};

const TOOL_RESULTS_BRETAGNE = [
  {
    toolName: "get_taux_avancement_territoire",
    output: { resultats: FICHE_BRETAGNE.tauxAvancement },
  },
  {
    toolName: "get_chantiers",
    output: { resultats: FICHE_BRETAGNE.chantiersEnRetard },
  },
  {
    toolName: "get_chantiers",
    output: { resultats: FICHE_BRETAGNE.chantiersEnDifficulte },
  },
  {
    toolName: "get_indicateurs",
    output: { resultats: FICHE_BRETAGNE.indicateurs[0] },
  },
];

const evidence = ({
  question,
  matter,
  profile = "ditp",
  answer = matter,
  toolCalls = [],
  toolResults = TOOL_RESULTS_BRETAGNE,
  dashboard = null,
  maskedTerritories = [],
  truth = FICHE_BRETAGNE,
  tableTerritories = [],
}: Partial<Evidence> & { question: string; matter: string }): Evidence => ({
  question,
  profile,
  currentTerritory: "REG-53",
  answer,
  matter,
  dashboard,
  toolCalls,
  toolResults,
  maskedTerritories,
  truth,
  tableTerritories,
});

function muter({
  reference,
  from,
  to,
}: {
  reference: string;
  from: string | RegExp;
  to: string;
}) {
  const mutated = reference.replace(from, to);
  if (mutated === reference) {
    throw new Error(`Mutation sans effet : « ${String(from)} »`);
  }
  return mutated;
}

// --- Synthèse d'un territoire -------------------------------------------

const SYNTHESE_QUESTION = "Fais moi la synthèse du territoire Bretagne";

const SYNTHESE_REFERENCE = `# Synthèse pour Bretagne

Dans Pilote, le TA 2025 de la région s'établit à 51%, pour une médiane des régions à 65%.

---

## Chantiers en retard

1 chantier est en retard de plus de 10 points par rapport à la médiane nationale :

**CH-005 — Réduire les délais de passage aux urgences**\\
**Écart** : -15 points\\
**Météo** : Appuis nécessaires

> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.

&nbsp;

**Synthèse — chantiers en retard** : le retard porte sur un chantier de santé, avec un écart de 15 points.

---

## Chantiers en difficulté

1 chantier est compromis ou nécessite un appui :

**CH-006 — Développer la prévention en santé**\\
**Écart** : 2 points\\
**Météo** : Objectifs compromis

> Pas de commentaire disponible

&nbsp;

**Synthèse — chantiers en difficulté** : un chantier de santé présente des objectifs compromis.

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.`;

const synthese = ({ from, to }: { from: string | RegExp; to: string }) =>
  evidence({
    question: SYNTHESE_QUESTION,
    matter: muter({ reference: SYNTHESE_REFERENCE, from, to }),
  });

const SYNTHESE: CalibrationCase[] = [
  {
    family: "syntheseTerritoire",
    label: "Référence",
    broken: null,
    evidence: evidence({
      question: SYNTHESE_QUESTION,
      matter: SYNTHESE_REFERENCE,
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Médiane inventée",
    broken: "Chiffres exacts",
    evidence: synthese({
      from: "médiane des régions à 65%",
      to: "médiane des régions à 58%",
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Cause inventée dans un résumé",
    broken: "Résumés fidèles",
    evidence: synthese({
      from: "> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.",
      to: "> Deux postes d'urgentistes sont vacants à Brest et Quimper à la suite d'un conflit social avec l'agence régionale de santé, et le délai médian de passage a remonté au premier semestre.",
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Recommandation",
    broken: "Pas d'opinion",
    evidence: synthese({
      from: "avec un écart de 15 points.",
      to: "avec un écart de 15 points. Il conviendrait de renforcer en priorité les recrutements d'urgentistes.",
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Écart omis",
    broken: "Écart et météo",
    // L'écart disparaît aussi de la synthèse de tendance : sinon le juge le
    // retrouve là et note, à raison, que le chiffre est donné.
    evidence: evidence({
      question: SYNTHESE_QUESTION,
      matter: muter({
        reference: muter({
          reference: SYNTHESE_REFERENCE,
          from: "**Écart** : -15 points\\\n",
          to: "",
        }),
        from: "le retard porte sur un chantier de santé, avec un écart de 15 points.",
        to: "le retard porte sur un chantier de santé.",
      }),
    }),
  },
];

// --- Chantiers en retard et leurs indicateurs ---------------------------

const RETARD_QUESTION =
  "Analyse les chantiers en retard sur Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.";

const RETARD_REFERENCE = `**CH-005 — Réduire les délais de passage aux urgences**
- Écart à la médiane : -15 points
- Météo : Appuis nécessaires

Indicateur IND-005 — Délai médian de passage aux urgences : valeur initiale 280, valeur actuelle 250, valeur cible 180, taux d'avancement 30 %.`;

const retard = ({ from, to }: { from: string | RegExp; to: string }) =>
  evidence({
    question: RETARD_QUESTION,
    matter: muter({ reference: RETARD_REFERENCE, from, to }),
  });

const RETARD: CalibrationCase[] = [
  {
    family: "chantiersEnRetard",
    label: "Référence",
    broken: null,
    evidence: evidence({ question: RETARD_QUESTION, matter: RETARD_REFERENCE }),
  },
  {
    family: "chantiersEnRetard",
    label: "Renvoi vers un tableau de bord",
    broken: "Valeurs des indicateurs",
    evidence: retard({
      from: /Indicateur IND-005[^\n]+/,
      to: "Les valeurs de ses indicateurs peuvent être affichées dans un tableau de bord.",
    }),
  },
  {
    family: "chantiersEnRetard",
    label: "Valeur actuelle fausse",
    broken: "Chiffres exacts",
    evidence: retard({
      from: "valeur actuelle 250",
      to: "valeur actuelle 210",
    }),
  },
  {
    family: "chantiersEnRetard",
    label: "Écart omis",
    broken: "Écart par chantier",
    evidence: retard({ from: "- Écart à la médiane : -15 points\n", to: "" }),
  },
];

// --- Comparer avec un autre territoire ----------------------------------

const FICHE_COMPARAISON: GroundTruth = {
  ...FICHE_BRETAGNE,
  territoires: [
    { code: "REG-52", nom: "Pays de la Loire", maille: "REG" },
    { code: "REG-53", nom: "Bretagne", maille: "REG" },
  ],
  tauxAvancement: [
    ...FICHE_BRETAGNE.tauxAvancement,
    {
      territoire_code: "REG-52",
      jalon: 2025,
      taux_avancement_global: "70%",
      mediane_repartition: "65%",
      position_mediane: "DANS_LA_MEDIANE",
    },
  ],
};

const COMPARAISON_QUESTION = "Compare Bretagne avec Pays de la Loire";

const COMPARAISON_REFERENCE = `| Territoire | TA 2025 | Médiane des régions | Position |
|---|---|---|---|
| Bretagne | 51% | 65% | En retard |
| Pays de la Loire | 70% | 65% | Dans la médiane |

Les Pays de la Loire devancent la Bretagne de 19 points de taux d'avancement. La Bretagne se situe 14 points sous la médiane des régions, les Pays de la Loire 5 points au-dessus.`;

const comparaison = (matter: string) =>
  evidence({
    question: COMPARAISON_QUESTION,
    matter,
    truth: FICHE_COMPARAISON,
    toolResults: [
      {
        toolName: "get_taux_avancement_territoire",
        output: { resultats: FICHE_COMPARAISON.tauxAvancement },
      },
    ],
    tableTerritories: ["REG-53", "REG-52"],
  });

const COMPARAISON: CalibrationCase[] = [
  {
    family: "comparaisonTerritoires",
    label: "Référence",
    broken: null,
    evidence: comparaison(COMPARAISON_REFERENCE),
  },
  {
    family: "comparaisonTerritoires",
    label: "Sens de l'écart inversé",
    broken: "Analyse des écarts",
    evidence: comparaison(
      muter({
        reference: COMPARAISON_REFERENCE,
        from: "Les Pays de la Loire devancent la Bretagne de 19 points",
        to: "La Bretagne devance les Pays de la Loire de 19 points",
      }),
    ),
  },
  {
    family: "comparaisonTerritoires",
    label: "Position face à la médiane fausse",
    broken: "Position face à la médiane",
    evidence: comparaison(
      muter({
        reference: muter({
          reference: COMPARAISON_REFERENCE,
          from: "| Bretagne | 51% | 65% | En retard |",
          to: "| Bretagne | 51% | 65% | Dans la médiane |",
        }),
        from: "La Bretagne se situe 14 points sous la médiane des régions, les Pays de la Loire 5 points au-dessus.",
        to: "Les deux régions se situent dans la médiane.",
      }),
    ),
  },
];

// --- Synthèse des commentaires ------------------------------------------

const COMMENTAIRES_RESULTS = [
  {
    toolName: "get_chantier_commentaires",
    output: {
      resultats: [
        {
          territoire_code: "REG-53",
          territoire_nom: "Bretagne",
          chantier_id: "CH-005",
          commentaires: [
            {
              id: "commentaire-ch-005",
              date_publication: "2026-09-15",
              type: "autres_resultats_obtenus",
              contenu:
                "<p>Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.</p>",
            },
          ],
        },
      ],
      types_non_accessibles: ["actions_a_venir", "actions_a_valoriser"],
    },
  },
  {
    toolName: "get_chantier_commentaires",
    output: {
      resultats: [
        {
          territoire_code: "REG-53",
          territoire_nom: "Bretagne",
          chantier_id: "CH-012",
          commentaires: [],
        },
      ],
      types_non_accessibles: ["actions_a_venir", "actions_a_valoriser"],
    },
  },
];

const COMMENTAIRES_QUESTION =
  "Synthétise les commentaires des chantiers suivants CH-005, CH-012, notamment les principales actions identifiées";

const COMMENTAIRES_REFERENCE = `**CH-005 — Réduire les délais de passage aux urgences**
Un numéro de régulation départemental unique fonctionne depuis mars. Action engagée : le recrutement de deux urgentistes par contrat de territoire, dont la signature est attendue en novembre.

**CH-012 — Développer l'apprentissage**
Aucun commentaire n'est publié pour ce chantier en Bretagne.

Les actions à venir et à valoriser relèvent de la vue nationale, à laquelle vous n'avez pas accès.`;

const commentaires = (matter: string) =>
  evidence({
    question: COMMENTAIRES_QUESTION,
    matter,
    profile: "coordinateur",
    truth: { ...FICHE_BRETAGNE, commentaires: [] },
    toolResults: COMMENTAIRES_RESULTS,
  });

const COMMENTAIRES: CalibrationCase[] = [
  {
    family: "commentaires",
    label: "Référence",
    broken: null,
    evidence: commentaires(COMMENTAIRES_REFERENCE),
  },
  {
    family: "commentaires",
    label: "Commentaire inventé pour CH-012",
    broken: "Une synthèse par chantier",
    evidence: commentaires(
      muter({
        reference: COMMENTAIRES_REFERENCE,
        from: "Aucun commentaire n'est publié pour ce chantier en Bretagne.",
        to: "Les entrées en apprentissage progressent grâce aux salons de l'orientation.",
      }),
    ),
  },
  {
    family: "commentaires",
    label: "Types nationaux présentés comme absents",
    broken: "Actions identifiées",
    evidence: commentaires(
      muter({
        reference: COMMENTAIRES_REFERENCE,
        from: "Les actions à venir et à valoriser relèvent de la vue nationale, à laquelle vous n'avez pas accès.",
        to: "Aucune action à venir ni à valoriser n'a été identifiée.",
      }),
    ),
  },
];

// --- Tableau de bord du territoire --------------------------------------

const DASHBOARD_QUESTION =
  "Compose un tableau de bord pour Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.";

const DASHBOARD_TEXTE = "Voici le tableau de bord de la Bretagne.";

const sectionChantier = ({
  id,
  nom,
  meteo,
  commentaire,
}: {
  id: string;
  nom: string;
  meteo: string;
  commentaire: string;
}): { widgets: WidgetDefinition[] } => ({
  widgets: [
    { type: "widget_titre_section", titre: `${id} — ${nom}` },
    { type: "widget_paragraph", contenu: [`Météo : ${meteo}`, commentaire] },
    {
      type: "widget_cartographie_meteo",
      chantier_id: id,
      territoire_code: "REG-53",
      maille: "departementale",
      jalon: 2025,
      width: 4,
    },
    {
      type: "widget_tableau_indicateurs_chantier",
      chantier_id: id,
      territoire_code: "REG-53",
      jalon: 2025,
    },
  ],
});

const SECTION_TERRITOIRE: WidgetDefinition[] = [
  {
    type: "widget_taux_avancement_territoire",
    territoire_code: "REG-53",
    jalon: 2025,
  },
  {
    type: "widget_nombre_chantiers_en_retard",
    territoire_code: "REG-53",
    jalon: 2025,
  },
  {
    type: "widget_nombre_chantiers_en_difficulte",
    territoire_code: "REG-53",
    jalon: 2025,
  },
  {
    type: "widget_cartographie_taux_avancement",
    territoire_code: "REG-53",
    maille: "departementale",
    jalon: 2025,
  },
];

const SECTIONS_CHANTIERS = [
  sectionChantier({
    ...CH_005,
    meteo: "Appuis nécessaires",
    // Le commentaire de synthèse tel que la fiche le porte : la demande dit
    // « la météo et le commentaire de synthèse », un résumé n'y répond pas.
    commentaire:
      "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
  }),
  sectionChantier({
    ...CH_006,
    meteo: "Objectifs compromis",
    commentaire: "Pas de commentaire disponible.",
  }),
];

function dashboardAvec(
  premiereSection: WidgetDefinition[],
): ComposeDashboardOutput {
  return {
    titre: "Tableau de bord Bretagne",
    containers: [{ widgets: premiereSection }, ...SECTIONS_CHANTIERS],
    _output_instructions: "",
  };
}

function decrire(dashboard: ComposeDashboardOutput) {
  return [
    `TABLEAU DE BORD « ${dashboard.titre} »`,
    ...dashboard.containers.flatMap((container, index) => [
      `Section ${index + 1} :`,
      ...container.widgets.map(({ type, ...rest }) => {
        return `- ${type} ${JSON.stringify(rest)}`;
      }),
    ]),
    "",
    "TEXTE D'ACCOMPAGNEMENT :",
    DASHBOARD_TEXTE,
  ].join("\n");
}

const tableauDeBord = (dashboard: ComposeDashboardOutput) =>
  evidence({
    question: DASHBOARD_QUESTION,
    matter: decrire(dashboard),
    answer: DASHBOARD_TEXTE,
    dashboard,
  });

const DASHBOARD: CalibrationCase[] = [
  {
    family: "dashboard",
    label: "Référence",
    broken: null,
    evidence: tableauDeBord(dashboardAvec(SECTION_TERRITOIRE)),
  },
  {
    family: "dashboard",
    label: "Cartographie du taux absente",
    broken: "Widgets conformes à la demande",
    evidence: tableauDeBord(dashboardAvec(SECTION_TERRITOIRE.slice(0, 3))),
  },
  {
    family: "dashboard",
    label: "Widget étranger à la demande",
    broken: "Widgets conformes à la demande",
    evidence: tableauDeBord(
      dashboardAvec([
        ...SECTION_TERRITOIRE,
        // Rien dans la demande n'appelle les valeurs remarquables. Une liste
        // des chantiers en retard ne convenait pas : la demande dit
        // « récupère la liste des chantiers », et le juge l'y retrouvait.
        {
          type: "widget_valeurs_remarquables_avancement",
          territoire_code: "REG-53",
          jalon: 2025,
        },
      ]),
    ),
  },
];

// --- Rapport complet ----------------------------------------------------

const RAPPORT_QUESTION =
  "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown";

const RAPPORT_REPONSE = "Votre rapport est disponible au téléchargement.";

const RAPPORT_REFERENCE = `RAPPORT EXPORTÉ :
# Synthèse Bretagne

## Taux d'avancement
Le TA 2025 de la Bretagne est de 51%, pour une médiane des régions à 65%.

## Chantiers en retard
CH-005 — Réduire les délais de passage aux urgences : écart de -15 points, météo Appuis nécessaires.

| Indicateur | VI | VA | VC | TA |
|---|---|---|---|---|
| IND-005 — Délai médian de passage aux urgences | 280 | 250 | 180 | 30 % |

## Chantiers en difficulté
CH-006 — Développer la prévention en santé : météo Objectifs compromis.

RÉPONSE DU CHAT :
${RAPPORT_REPONSE}`;

const rapport = (matter: string) =>
  evidence({
    question: RAPPORT_QUESTION,
    matter,
    answer: RAPPORT_REPONSE,
    toolCalls: [{ toolName: "export_rapport", input: { format: "markdown" } }],
  });

const RAPPORT: CalibrationCase[] = [
  {
    family: "rapport",
    label: "Référence",
    broken: null,
    evidence: rapport(RAPPORT_REFERENCE),
  },
  {
    family: "rapport",
    label: "Indicateurs en texte, sans tableau",
    broken: "Tableau d'indicateurs",
    evidence: rapport(
      muter({
        reference: RAPPORT_REFERENCE,
        from: /\| Indicateur[\s\S]+?30 % \|/,
        to: "Indicateur IND-005 : 280 au départ, 250 aujourd'hui, 180 visés.",
      }),
    ),
  },
  {
    family: "rapport",
    label: "Chantiers en difficulté absents",
    broken: "Sections demandées",
    evidence: rapport(
      muter({
        reference: RAPPORT_REFERENCE,
        from: /## Chantiers en difficulté\n[^\n]+\n/,
        to: "",
      }),
    ),
  },
];

// --- Synthèse d'un département : la maille nommée ------------------------

const FICHE_FINISTERE: GroundTruth = {
  territoires: [{ code: "DEPT-29", nom: "Finistère", maille: "DEPT" }],
  tauxAvancement: [
    {
      territoire_code: "DEPT-29",
      jalon: 2025,
      taux_avancement_global: "53%",
      mediane_repartition: "56%",
      position_mediane: "DANS_LA_MEDIANE",
    },
  ],
  chantiersEnRetard: [
    {
      territoire_code: "DEPT-29",
      territoire_nom: "Finistère",
      jalon: 2025,
      chantiers: [
        chantier({
          ...CH_005,
          ecart: -22,
          meteo: "NUAGE",
          commentaire:
            "Le délai de passage aux urgences reste au-dessus de la cible faute de médecins régulateurs.",
        }),
      ],
    },
  ],
  chantiersEnDifficulte: [
    {
      territoire_code: "DEPT-29",
      territoire_nom: "Finistère",
      jalon: 2025,
      chantiers: [
        chantier({ ...CH_006, ecart: 1, meteo: "ORAGE", commentaire: null }),
      ],
    },
  ],
  indicateurs: [],
  commentaires: [],
};

const FINISTERE_REFERENCE = muter({
  reference: muter({
    reference: muter({
      reference: muter({
        reference: SYNTHESE_REFERENCE,
        from: "# Synthèse pour Bretagne\n\nDans Pilote, le TA 2025 de la région s'établit à 51%, pour une médiane des régions à 65%.",
        to: "# Synthèse pour Finistère\n\nDans Pilote, le TA 2025 du département s'établit à 53%, pour une médiane des départements à 56%.",
      }),
      from: "**Écart** : -15 points",
      to: "**Écart** : -22 points",
    }),
    from: "> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.",
    to: "> Le délai de passage aux urgences dépasse toujours la cible, faute de médecins régulateurs.",
  }),
  from: /avec un écart de 15 points\.\n\n---\n\n## Chantiers en difficulté[\s\S]+?\*\*Écart\*\* : 2 points/,
  to: "avec un écart de 22 points.\n\n---\n\n## Chantiers en difficulté\n\n1 chantier est compromis ou nécessite un appui :\n\n**CH-006 — Développer la prévention en santé**\\\n**Écart** : 1 points",
});

const finistere = (matter: string) =>
  evidence({
    question: "Fais moi la synthèse du territoire Finistère",
    matter,
    truth: FICHE_FINISTERE,
    toolResults: [
      {
        toolName: "get_taux_avancement_territoire",
        output: { resultats: FICHE_FINISTERE.tauxAvancement },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_FINISTERE.chantiersEnRetard },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_FINISTERE.chantiersEnDifficulte },
      },
    ],
  });

const MAILLE: CalibrationCase[] = [
  {
    family: "syntheseTerritoire",
    label: "Référence départementale",
    broken: null,
    evidence: finistere(FINISTERE_REFERENCE),
  },
  {
    family: "syntheseTerritoire",
    label: "Département présenté comme la région",
    broken: "Maille nommée",
    evidence: finistere(
      muter({
        reference: FINISTERE_REFERENCE,
        from: "le TA 2025 du département",
        to: "le TA 2025 de la région",
      }),
    ),
  },
];

// --- Synthèse hors périmètre : la restriction d'accès -------------------

const CH_007 = {
  id: "CH-007",
  nom: "Rénover énergétiquement les logements privés",
};

const FICHE_PAYS_DE_LA_LOIRE: GroundTruth = {
  territoires: [{ code: "REG-52", nom: "Pays de la Loire", maille: "REG" }],
  tauxAvancement: [
    {
      territoire_code: "REG-52",
      jalon: 2025,
      taux_avancement_global: "70%",
      mediane_repartition: "65%",
      position_mediane: "DANS_LA_MEDIANE",
    },
  ],
  chantiersEnRetard: [
    {
      territoire_code: "REG-52",
      territoire_nom: "Pays de la Loire",
      jalon: 2025,
      chantiers: [
        chantier({ ...CH_007, ecart: -20, meteo: "NUAGE", commentaire: null }),
      ],
    },
  ],
  chantiersEnDifficulte: [
    {
      territoire_code: "REG-52",
      territoire_nom: "Pays de la Loire",
      jalon: 2025,
      chantiers: [],
    },
  ],
  indicateurs: [],
  commentaires: [],
};

const RESTRICTION_REFERENCE = `# Synthèse pour Pays de la Loire

Dans Pilote, le TA 2025 de la région s'établit à 70%, pour une médiane des régions à 65%.

---

## Chantiers en retard

1 chantier est en retard de plus de 10 points par rapport à la médiane nationale :

**CH-007 — Rénover énergétiquement les logements privés**\\
**Écart** : -20 points\\
**Météo** : Appuis nécessaires

> Le commentaire de synthèse n'est pas accessible : ce territoire est hors de votre périmètre.

&nbsp;

**Synthèse — chantiers en retard** : un chantier du logement est en retard de 20 points.

---

## Chantiers en difficulté

Aucun chantier n'est compromis ni ne nécessite d'appui.

**Synthèse — chantiers en difficulté** : aucun chantier concerné.

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.`;

const horsPerimetre = (matter: string) =>
  evidence({
    question:
      "Fais moi la synthèse des difficultés du territoire Pays de la Loire",
    matter,
    profile: "coordinateur",
    truth: FICHE_PAYS_DE_LA_LOIRE,
    maskedTerritories: ["REG-52"],
    toolResults: [
      {
        toolName: "get_taux_avancement_territoire",
        output: { resultats: FICHE_PAYS_DE_LA_LOIRE.tauxAvancement },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_PAYS_DE_LA_LOIRE.chantiersEnRetard },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_PAYS_DE_LA_LOIRE.chantiersEnDifficulte },
      },
    ],
  });

const RESTRICTION: CalibrationCase[] = [
  {
    family: "syntheseTerritoire",
    label: "Référence hors périmètre",
    broken: null,
    evidence: horsPerimetre(RESTRICTION_REFERENCE),
  },
  {
    family: "syntheseTerritoire",
    label: "Commentaire masqué présenté comme absent",
    broken: "Restriction signalée",
    evidence: horsPerimetre(
      muter({
        reference: RESTRICTION_REFERENCE,
        from: "> Le commentaire de synthèse n'est pas accessible : ce territoire est hors de votre périmètre.",
        to: "> Pas de commentaire disponible",
      }),
    ),
  },
];

// --- Synthèse d'un chantier sur un territoire ---------------------------

const CHANTIER_QUESTION = `Fais moi la synthèse du chantier CH-005 sur le territoire Bretagne
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`;

const CHANTIER_RESULTS = [
  {
    toolName: "get_chantiers",
    output: { resultats: FICHE_BRETAGNE.chantiersEnRetard },
  },
  {
    toolName: "get_chantiers",
    output: {
      resultats: [
        {
          territoire_code: "REG-52",
          territoire_nom: "Pays de la Loire",
          jalon: 2025,
          chantiers: [
            {
              ...chantier({
                ...CH_005,
                ecart: 8,
                meteo: "COUVERT",
                commentaire: null,
              }),
              taux_avancement: 75,
            },
          ],
        },
      ],
    },
  },
  {
    toolName: "get_chantier_commentaires",
    output: {
      resultats: [
        {
          territoire_code: "REG-53",
          territoire_nom: "Bretagne",
          chantier_id: "CH-005",
          commentaires: [
            {
              id: "commentaire-donnees-ch-005",
              date_publication: "2026-09-15",
              type: "commentaires_sur_les_donnees",
              contenu:
                "<p>La hausse du délai au premier semestre s'explique par la fermeture estivale de deux lignes de SMUR. La donnée de juin est provisoire.</p>",
            },
          ],
        },
      ],
      types_non_accessibles: [],
    },
  },
];

const CHANTIER_REFERENCE = `## CH-005 — Réduire les délais de passage aux urgences, en Bretagne

Le chantier est en retard de 15 points sur la médiane, avec une météo « Appuis nécessaires ».

## Position face aux autres territoires

Sur ce chantier, la Bretagne (écart de -15 points) se situe derrière les Pays de la Loire (écart de +8 points, taux d'avancement de 75 %).

## Difficultés remontées dans les commentaires

Deux postes d'urgentistes sont vacants à Brest et Quimper. La fermeture estivale de deux lignes de SMUR explique la hausse du délai au premier semestre, et la donnée de juin reste provisoire.`;

const syntheseChantier = (matter: string) =>
  evidence({
    question: CHANTIER_QUESTION,
    matter,
    toolResults: CHANTIER_RESULTS,
  });

const SYNTHESE_CHANTIER: CalibrationCase[] = [
  {
    family: "syntheseChantier",
    label: "Référence",
    broken: null,
    evidence: syntheseChantier(CHANTIER_REFERENCE),
  },
  {
    family: "syntheseChantier",
    label: "Volet des commentaires absent",
    broken: "Trois volets",
    evidence: syntheseChantier(
      muter({
        reference: CHANTIER_REFERENCE,
        from: /\n\n## Difficultés remontées dans les commentaires[\s\S]+$/,
        to: "",
      }),
    ),
  },
  {
    family: "syntheseChantier",
    label: "Position sans chiffre",
    broken: "Situé face aux autres territoires",
    evidence: syntheseChantier(
      muter({
        reference: CHANTIER_REFERENCE,
        from: "Sur ce chantier, la Bretagne (écart de -15 points) se situe derrière les Pays de la Loire (écart de +8 points, taux d'avancement de 75 %).",
        to: "Sur ce chantier, la Bretagne se situe derrière les Pays de la Loire.",
      }),
    ),
  },
  {
    family: "syntheseChantier",
    label: "Difficulté inventée",
    broken: "Difficultés tirées des commentaires",
    evidence: syntheseChantier(
      muter({
        reference: CHANTIER_REFERENCE,
        from: "La fermeture estivale de deux lignes de SMUR explique la hausse du délai au premier semestre, et la donnée de juin reste provisoire.",
        to: "Les personnels contestent la réorganisation des services d'urgence et un mouvement de grève est annoncé.",
      }),
    ),
  },
];

// --- Synthèse d'une région et de ses départements -----------------------

const FICHE_SOUS_TERRITOIRES: GroundTruth = {
  territoires: [
    { code: "DEPT-35", nom: "Ille-et-Vilaine", maille: "DEPT" },
    { code: "REG-53", nom: "Bretagne", maille: "REG" },
  ],
  tauxAvancement: [
    ...FICHE_BRETAGNE.tauxAvancement,
    {
      territoire_code: "DEPT-35",
      jalon: 2025,
      taux_avancement_global: "46%",
      mediane_repartition: "57%",
      position_mediane: "EN_RETARD",
    },
  ],
  chantiersEnRetard: [
    ...FICHE_BRETAGNE.chantiersEnRetard,
    {
      territoire_code: "DEPT-35",
      territoire_nom: "Ille-et-Vilaine",
      jalon: 2025,
      chantiers: [
        chantier({
          ...CH_005,
          ecart: -18,
          meteo: "NUAGE",
          commentaire:
            "Le délai de passage aux urgences reste au-dessus de la cible faute de médecins régulateurs.",
        }),
      ],
    },
  ],
  chantiersEnDifficulte: [
    ...FICHE_BRETAGNE.chantiersEnDifficulte,
    {
      territoire_code: "DEPT-35",
      territoire_nom: "Ille-et-Vilaine",
      jalon: 2025,
      chantiers: [
        chantier({ ...CH_006, ecart: 1, meteo: "ORAGE", commentaire: null }),
      ],
    },
  ],
  indicateurs: [],
  commentaires: [],
};

const SOUS_TERRITOIRES_REFERENCE = `# Comparaison : Bretagne vs Ille-et-Vilaine

| Territoire | TA 2025 | Médiane | Position |
|---|---|---|---|
| Bretagne | 51% | 65% | En retard |
| Ille-et-Vilaine | 46% | 57% | En retard |

## Analyse des écarts

La Bretagne devance l'Ille-et-Vilaine de 5 points de taux d'avancement. Les deux territoires se situent sous la médiane de leur maille.

---

## Chantiers en retard

1 chantier est en retard de plus de 10 points par rapport à la médiane nationale.

### Communs à plusieurs territoires

**CH-005 — Réduire les délais de passage aux urgences**\\
**Territoires concernés** : Bretagne, Ille-et-Vilaine

> Des postes d'urgentistes restent vacants et le délai de passage dépasse la cible.

&nbsp;

**Synthèse — chantiers en retard** : le retard se concentre sur un chantier de santé commun aux deux territoires.

---

## Chantiers en difficulté

1 chantier est compromis ou nécessite un appui.

### Communs à plusieurs territoires

**CH-006 — Développer la prévention en santé**\\
**Territoires concernés** : Bretagne, Ille-et-Vilaine\\
**Météo** : Objectifs compromis

> Pas de commentaire disponible

&nbsp;

**Synthèse — chantiers en difficulté** : un chantier de santé présente des objectifs compromis sur les deux territoires.

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.`;

const sousTerritoires = (matter: string) =>
  evidence({
    question: "Fais moi la synthèse de Bretagne et ses départements",
    matter,
    truth: FICHE_SOUS_TERRITOIRES,
    tableTerritories: ["REG-53", "DEPT-35"],
    toolResults: [
      {
        toolName: "get_taux_avancement_territoire",
        output: { resultats: FICHE_SOUS_TERRITOIRES.tauxAvancement },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_SOUS_TERRITOIRES.chantiersEnRetard },
      },
      {
        toolName: "get_chantiers",
        output: { resultats: FICHE_SOUS_TERRITOIRES.chantiersEnDifficulte },
      },
    ],
  });

const SOUS_TERRITOIRES: CalibrationCase[] = [
  {
    family: "syntheseSousTerritoires",
    label: "Référence",
    broken: null,
    evidence: sousTerritoires(SOUS_TERRITOIRES_REFERENCE),
  },
  {
    family: "syntheseSousTerritoires",
    label: "Chantier commun éclaté par territoire",
    broken: "Communs et spécifiques",
    evidence: sousTerritoires(
      muter({
        reference: SOUS_TERRITOIRES_REFERENCE,
        from: "### Communs à plusieurs territoires\n\n**CH-005 — Réduire les délais de passage aux urgences**\\\n**Territoires concernés** : Bretagne, Ille-et-Vilaine",
        to: "### Spécifiques à Bretagne\n\n**CH-005 — Réduire les délais de passage aux urgences**\\\n**Écart** : -15 points\n\n### Spécifiques à Ille-et-Vilaine\n\n**CH-005 — Réduire les délais de passage aux urgences**\\\n**Écart** : -18 points",
      }),
    ),
  },
];

// --- Comparer les taux entre deux jalons --------------------------------

const tauxBretagne = (jalon: number, taux: string) => ({
  territoire_code: "REG-53",
  jalon,
  taux_avancement_global: taux,
  mediane_repartition: taux === "- %" ? "- %" : "65%",
  position_mediane: taux === "- %" ? null : ("EN_RETARD" as "EN_RETARD" | null),
});

const jalons = ({
  question,
  matter,
  autreJalon,
  autreTaux,
}: {
  question: string;
  matter: string;
  autreJalon: number;
  autreTaux: string;
}) => {
  const tauxAvancement = [
    tauxBretagne(2025, "51%"),
    tauxBretagne(autreJalon, autreTaux),
  ];
  return evidence({
    question,
    matter,
    truth: { ...FICHE_BRETAGNE, tauxAvancement },
    toolResults: tauxAvancement.map((resultat) => ({
      toolName: "get_taux_avancement_territoire",
      output: { resultats: [resultat] },
    })),
  });
};

const JALONS_2024_QUESTION =
  "Compare les taux d'avancement de Bretagne entre le jalon 2025 et 2024";
const JALONS_2024_REFERENCE =
  "Le taux d'avancement de la Bretagne passe de 43% au jalon 2024 à 51% au jalon 2025, soit une hausse de 8 points.";
const JALONS_2023_QUESTION =
  "Compare les taux d'avancement de Bretagne entre le jalon 2025 et 2023";
const JALONS_2023_REFERENCE =
  "Les données du jalon 2023 ne sont pas disponibles pour la Bretagne. Au jalon 2025, son taux d'avancement est de 51%.";

const JALONS: CalibrationCase[] = [
  {
    family: "comparaisonJalons",
    label: "Référence 2024",
    broken: null,
    evidence: jalons({
      question: JALONS_2024_QUESTION,
      matter: JALONS_2024_REFERENCE,
      autreJalon: 2024,
      autreTaux: "43%",
    }),
  },
  {
    family: "comparaisonJalons",
    label: "Sens de l'évolution inversé",
    broken: "Évolution entre jalons",
    evidence: jalons({
      question: JALONS_2024_QUESTION,
      matter: muter({
        reference: JALONS_2024_REFERENCE,
        from: "soit une hausse de 8 points",
        to: "soit une baisse de 8 points",
      }),
      autreJalon: 2024,
      autreTaux: "43%",
    }),
  },
  {
    family: "comparaisonJalons",
    label: "Référence 2023, sans données",
    broken: null,
    evidence: jalons({
      question: JALONS_2023_QUESTION,
      matter: JALONS_2023_REFERENCE,
      autreJalon: 2023,
      autreTaux: "- %",
    }),
  },
  {
    family: "comparaisonJalons",
    label: "Jalon sans données passé sous silence",
    broken: "Données indisponibles dites",
    evidence: jalons({
      question: JALONS_2023_QUESTION,
      matter: "Au jalon 2025, le taux d'avancement de la Bretagne est de 51%.",
      autreJalon: 2023,
      autreTaux: "- %",
    }),
  },
];

export const CALIBRATION_CASES: CalibrationCase[] = [
  ...SYNTHESE,
  ...MAILLE,
  ...RESTRICTION,
  ...SYNTHESE_CHANTIER,
  ...SOUS_TERRITOIRES,
  ...RETARD,
  ...COMPARAISON,
  ...JALONS,
  ...COMMENTAIRES,
  ...DASHBOARD,
  ...RAPPORT,
];

/**
 * Des défauts que le juge ne voyait pas (calibration du 30/09 : 0/3), passés
 * en critères mécaniques. Ils ne vont pas à la calibration du juge : un test
 * unitaire vérifie que chacun échoue son critère, et lui seul.
 */
export const MECHANICAL_MUTANTS: CalibrationCase[] = [
  {
    // Revue du 30/09 : Albert peut lire les commentaires par `get_chantiers`
    // plutôt que par `get_chantier_commentaires`. La recopie doit se voir
    // quel que soit l'outil qui a fourni le commentaire.
    family: "commentaires",
    label: "Commentaire lu par get_chantiers et recopié",
    broken: "Pas de recopie",
    evidence: evidence({
      question: COMMENTAIRES_QUESTION,
      matter: `**CH-005 — Réduire les délais de passage aux urgences**
Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.`,
      profile: "coordinateur",
      toolResults: [
        {
          toolName: "get_chantiers",
          output: {
            resultats: [
              {
                territoire_code: "REG-53",
                territoire_nom: "Bretagne",
                jalon: 2025,
                chantiers: [
                  {
                    ...chantier({
                      ...CH_005,
                      ecart: -15,
                      meteo: "NUAGE",
                      commentaire: null,
                    }),
                    commentaires: {
                      donnees: null,
                      autresResultats: {
                        contenu:
                          "<p>Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.</p>",
                        date: "2026-09-15",
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Résumé délayé",
    broken: "Résumés en 1 à 2 phrases",
    evidence: synthese({
      from: "> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.",
      to: "> Le délai médian de passage a remonté au premier semestre. Deux postes d'urgentistes sont vacants à Brest et Quimper. Une régulation téléphonique fonctionne depuis mars.",
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Commentaire de synthèse recopié",
    broken: "Pas de recopie",
    evidence: synthese({
      from: "> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.",
      to: "> Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Commentaire manquant non signalé",
    broken: "Absence de commentaire signalée",
    evidence: synthese({ from: "> Pas de commentaire disponible\n\n", to: "" }),
  },
  {
    family: "commentaires",
    label: "Commentaire reçu recopié",
    broken: "Pas de recopie",
    evidence: commentaires(
      muter({
        reference: COMMENTAIRES_REFERENCE,
        from: "Un numéro de régulation départemental unique fonctionne depuis mars. Action engagée : le recrutement de deux urgentistes par contrat de territoire, dont la signature est attendue en novembre.",
        to: "Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.",
      }),
    ),
  },
];
