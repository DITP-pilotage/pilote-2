import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `clarify_with_choices`.
 *
 * L'agent doit appeler l'outil dans chaque situation où il a un doute et fait
 * choisir l'utilisateur parmi une liste finie d'options qu'il a identifiées.
 * Les cas ambigus s'appuient sur le monde de base : trois chantiers logement,
 * deux handicap, deux sur les violences faites aux femmes. « Le 84 » désigne
 * le département DEPT-84 (D3) : ce n'est pas une ambiguïté.
 *
 * Une demande que le dashboard ne sait pas rendre telle quelle (graphique de
 * répartition, PIL-1855) doit aussi passer par l'outil, avec des alternatives
 * réalisables, plutôt que par un dashboard hors sujet. Le tableau des taux
 * d'avancement de chaque chantier, qu'il doit savoir proposer à la place, est
 * vérifié dans la suite de `get_chantiers`.
 *
 * Les négatifs n'ont rien à départager : un seul chantier correspond, ou la
 * maille est précisée. Sur une salutation, aucun outil : proposer un menu de
 * ce que l'agent sait faire serait une faute. Une demande de mise à jour qui
 * ne précise pas le type de valeurs n'est pas non plus servie par cet outil :
 * `get_indicateurs_a_completer` demande lui-même la précision.
 */

const CASES: ToolCase[] = [
  {
    question: "Fais-moi la synthèse du chantier sur le logement en Bretagne",
    reason: "trois chantiers logement : choix à faire",
    expected: [{ toolName: "clarify_with_choices" }],
  },
  {
    question:
      "Quels sont les indicateurs du chantier sur le handicap au national ?",
    reason: "deux chantiers handicap : choix à faire",
    expected: [{ toolName: "clarify_with_choices" }],
  },
  {
    question:
      "Quelle est l'ambition du chantier sur les violences faites aux femmes ?",
    reason: "deux chantiers violences faites aux femmes : choix à faire",
    expected: [{ toolName: "clarify_with_choices" }],
  },
  {
    question:
      "Peux tu me faire un graphique avec la répartition des chantiers par taux d'avancement pour l'ensemble des chantiers du département de la Sarthe",
    reason: "graphique de répartition hors catalogue : alternatives à proposer",
    expected: [{ toolName: "clarify_with_choices" }],
    forbidden: ["create_dashboard"],
    optionsInterdites: [
      {
        motif: "carte.*(chaque chantier|\\bchantiers\\b)",
        raison: "une carte porte sur un chantier précis, jamais sur tous",
      },
      {
        motif: "r[ée]partition|histogramme|camembert|diagramme",
        raison: "aucun dashboard ne rend une répartition",
      },
    ],
  },
  {
    question: "Quels indicateurs sont non à jour sur le CH-018 ?",
    reason:
      "CAS NÉGATIF : mise à jour sans type de valeurs → get_indicateurs_a_completer, qui demande lui-même la précision",
    expected: [
      {
        toolName: "get_indicateurs_a_completer",
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quelle est l'ambition du chantier sur l'habitat indigne ?",
    reason: "CAS NÉGATIF : un seul chantier correspond",
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quel est le taux d'avancement dans le 84 ?",
    reason: "CAS NÉGATIF : « le 84 » désigne le département (D3)",
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quel est le taux d'avancement de la région 84 ?",
    reason: "CAS NÉGATIF : maille précisée, REG-84 sans ambiguïté",
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quel est le taux d'avancement du département 84 ?",
    reason: "CAS NÉGATIF : maille précisée, DEPT-84 sans ambiguïté",
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason: "CAS NÉGATIF : salutation, aucun outil, pas de menu",
    expected: [],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "clarify_with_choices",
  cases: CASES,
});
