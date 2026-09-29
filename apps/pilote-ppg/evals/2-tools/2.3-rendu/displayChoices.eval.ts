import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `display_choices`.
 *
 * L'agent doit appeler l'outil dans chaque situation où il a un doute et fait
 * choisir l'utilisateur parmi une liste finie d'options qu'il a identifiées.
 * Les cas ambigus s'appuient sur le monde de base : trois chantiers logement,
 * deux handicap, deux sur les violences faites aux femmes. « Le 84 » est à la
 * fois REG-84 (Auvergne-Rhône-Alpes) et DEPT-84 (Vaucluse) ; précisé
 * « région » ou « département », il ne l'est plus.
 *
 * Les négatifs n'ont rien à départager : un seul chantier correspond, ou la
 * maille est précisée. Sur une salutation, aucun outil : proposer un menu de
 * ce que l'agent sait faire serait une faute.
 *
 * Suite attendue dans le rouge tant que PIL-1834 n'est pas traité : le prompt
 * système ne dit jamais quand utiliser l'outil, et les workflows de recherche
 * demandent de lister les candidats en texte.
 */

const CASES: ToolCase[] = [
  {
    question: "Fais-moi la synthèse du chantier sur le logement en Bretagne",
    reason: "trois chantiers logement : choix à faire",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question:
      "Quels sont les indicateurs du chantier sur le handicap au national ?",
    reason: "deux chantiers handicap : choix à faire",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question:
      "Quelle est l'ambition du chantier sur les violences faites aux femmes ?",
    reason: "deux chantiers violences faites aux femmes : choix à faire",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Quel est le taux d'avancement dans le 84 ?",
    reason: "« le 84 » : région ou département",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Quelle est l'ambition du chantier sur l'habitat indigne ?",
    reason: "CAS NÉGATIF : un seul chantier correspond",
    forbidden: ["display_choices"],
  },
  {
    question: "Quel est le taux d'avancement de la région 84 ?",
    reason: "CAS NÉGATIF : maille précisée, REG-84 sans ambiguïté",
    forbidden: ["display_choices"],
  },
  {
    question: "Quel est le taux d'avancement du département 84 ?",
    reason: "CAS NÉGATIF : maille précisée, DEPT-84 sans ambiguïté",
    forbidden: ["display_choices"],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason: "CAS NÉGATIF : salutation, aucun outil, pas de menu",
    expected: [],
  },
];

toolSelectionEval({
  famille: "rendu",
  tool: "display_choices",
  cases: CASES,
});
