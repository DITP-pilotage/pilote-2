import type { ToolCase } from "../../types";

const OUTILS_ENCART = [
  "rediger_synthese_territoire",
  "rediger_comparaison_territoires",
];

/** Les demandes précises : une réponse dans le fil, jamais un encart. */
export const DEMANDES_PRECISES: ToolCase[] = [
  {
    question: "Les chantiers en retard du Nord",
    reason: "un critère précis : get_chantiers, sans encart",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Le taux d'avancement de la Gironde",
    reason: "un critère précis : le taux seul",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Les difficultés en Hauts-de-France",
    reason: "« les difficultés » sans « synthèse » : les vues de chantiers",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Compare le CH-062 entre le Nord et la Gironde",
    reason: "un chantier précis",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Où en sont l'Occitanie et ses départements ?",
    reason:
      "un territoire et ses sous-territoires sans « synthèse » ni « compare » : le taux",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Fais-moi un rapport sur la Gironde",
    reason: "« rapport » : un fichier, pas un encart",
    forbidden: OUTILS_ENCART,
  },
  {
    question: "Trace la courbe de l'indicateur 1023 dans le Nord",
    reason: "une courbe : un dashboard",
    forbidden: OUTILS_ENCART,
  },
];
