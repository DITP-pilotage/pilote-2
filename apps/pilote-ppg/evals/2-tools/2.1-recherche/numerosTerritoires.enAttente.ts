import type { ToolCase } from "../../types";

/**
 * Cas mis de côté (PIL-1900, étape 5), non joués : un territoire désigné par
 * un numéro. Tout code de région est aussi un numéro de département (REG-84
 * est Auvergne-Rhône-Alpes, DEPT-84 le Vaucluse) ; un numéro seul désigne le
 * département (D3). Ils ont échoué à chaque étape depuis la ligne de base :
 * l'agent traite le numéro comme un code connu au lieu de le rechercher. Le
 * comportement attendu (recherche ou résolution dans le code) reste à décider ;
 * ces cas reviendront dans la suite `search_territoires` avec la décision.
 */
export const NUMEROS_DE_TERRITOIRE_EN_ATTENTE: ToolCase[] = [
  {
    question: "Quel est le taux d'avancement dans le 84 ?",
    reason: "numéro seul : le département 84 (D3), code à résoudre",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement de la région 84 ?",
    reason: "numéro précisé « région » : la recherche reste nécessaire",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement du département 84 ?",
    reason: "numéro précisé « département » : la recherche reste nécessaire",
    expected: [{ toolName: "search_territoires" }],
  },
];
