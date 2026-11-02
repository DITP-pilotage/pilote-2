import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_valeurs_initiales_cibles_manquantes`.
 *
 * L'agent appelle l'outil quand la demande vise les valeurs initiales ou les
 * valeurs cibles manquantes, sans clarification puisque le type de valeurs est
 * connu. Si elle vise aussi les valeurs d'avancement, il appelle en parallèle
 * `get_valeurs_avancement_non_a_jour`.
 *
 * Les négatifs portent sur le taux non calculé (`get_chantiers_signales`), le
 * retard d'avancement (`get_chantiers`) et les valeurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question: "Quels indicateurs du CH-018 n'ont pas de cible ?",
    reason: "exemple du ticket : VC seule, sur un chantier",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { chantier_ids: ["CH-018"], valeurs: "vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels indicateurs n'ont pas de valeur initiale ?",
    reason: "VI seule",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vi" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Sur quels territoires manque-t-il une valeur initiale ou une cible pour l'IND-894 ?",
    reason: "exemple du ticket : les deux valeurs, détail par territoire",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: {
          indicateur_ids: ["IND-894"],
          valeurs: "vi_et_vc",
          detail: "territoires",
        },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels indicateurs n'ont ni VI ni VC au national ?",
    reason: "« ni VI ni VC » : l'une ou l'autre manquante, périmètre NAT-FR",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: {
          valeurs: "vi_et_vc",
          perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] },
        },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quelles cibles sont à mettre à jour sur le CH-018 ?",
    reason: "cible nommée : pas de clarification",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { chantier_ids: ["CH-018"], valeurs: "vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Valeurs initiales et cibles manquantes sur tout mon périmètre",
    reason: "libellé du bouton « VI et VC » : pas de nouvelle clarification",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vi_et_vc" },
      },
    ],
    forbidden: ["clarify_with_choices", "get_valeurs_avancement_non_a_jour"],
  },
  {
    question: "Quels indicateurs n'ont pas de cible en 2027 ?",
    reason: "année nommée : l'outil n'évalue que le jalon en cours",
    expected: [
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Quelles valeurs d'avancement ne sont pas à jour et quels indicateurs n'ont pas de cible ?",
    reason: "combinaison VA et VC : les deux outils",
    expected: [
      { toolName: "get_valeurs_avancement_non_a_jour" },
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Donne toutes les valeurs à compléter : VA non à jour, VI et VC manquantes",
    reason: "les trois types : les deux outils",
    expected: [
      { toolName: "get_valeurs_avancement_non_a_jour" },
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vi_et_vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question:
      "Les trois sur tout mon périmètre : valeurs d'avancement non à jour, valeurs initiales et cibles manquantes",
    reason: "libellé du bouton « les trois » : les deux outils",
    expected: [
      { toolName: "get_valeurs_avancement_non_a_jour" },
      {
        toolName: "get_valeurs_initiales_cibles_manquantes",
        input: { valeurs: "vi_et_vc" },
      },
    ],
    forbidden: ["clarify_with_choices"],
  },
  {
    question: "Quels chantiers ont un taux d'avancement non calculé ?",
    reason: "CAS NÉGATIF : catégorie de signalement → get_chantiers_signales",
    forbidden: ["get_valeurs_initiales_cibles_manquantes"],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : retard d'avancement → get_chantiers(view='en_retard')",
    forbidden: ["get_valeurs_initiales_cibles_manquantes"],
  },
  {
    question:
      "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "CAS NÉGATIF : valeurs des indicateurs → get_indicateurs",
    forbidden: ["get_valeurs_initiales_cibles_manquantes"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_valeurs_initiales_cibles_manquantes",
  cases: CASES,
});
