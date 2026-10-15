import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `consulter_centre_aide`.
 *
 * L'agent appelle l'outil pour une définition, un calcul ou une procédure.
 * Le piège principal : le glossaire du prompt définit déjà le taux
 * d'avancement et la météo, et l'agent est tenté de répondre de mémoire.
 *
 * Les négatifs sont des questions de données, y compris avec le vocabulaire
 * du glossaire (« en retard »).
 */

const ATTENDU = [{ toolName: "consulter_centre_aide" }];
const INTERDIT = ["consulter_centre_aide"];

const CASES: ToolCase[] = [
  {
    question: "Comment est calculé le taux d'avancement d'un chantier ?",
    reason:
      "définition aussi présente dans le glossaire : le centre d'aide prime",
    expected: ATTENDU,
  },
  {
    question: "Que signifie la météo d'un chantier ?",
    reason: "définition aussi présente dans le glossaire",
    expected: ATTENDU,
  },
  {
    question: "Comment importer les mesures de mes indicateurs ?",
    reason: "procédure de saisie et d'import",
    expected: ATTENDU,
  },
  {
    question: "Comment exporter les données d'un chantier ?",
    reason: "procédure d'export",
    expected: ATTENDU,
  },
  {
    question: "À quoi sert une proposition de valeur d'avancement ?",
    reason: "fonctionnement des PVA, pas leur contenu",
    expected: ATTENDU,
  },
  {
    question: "Comment donner accès à PILOTE à un collègue ?",
    reason: "gestion des utilisateurs",
    expected: ATTENDU,
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "donnée pure, vocabulaire d'une notion",
    forbidden: INTERDIT,
  },
  {
    question: "Quels sont les chantiers en retard en Bretagne ?",
    reason: "donnée pure, vocabulaire « en retard » du glossaire",
    forbidden: INTERDIT,
  },
  {
    question: "Quelle est l'ambition du CH-007 ?",
    reason: "objectifs d'un chantier, pas une question d'aide",
    forbidden: INTERDIT,
  },
];

toolSelectionEval({
  famille: "aide",
  tool: "consulter_centre_aide",
  cases: CASES,
});
