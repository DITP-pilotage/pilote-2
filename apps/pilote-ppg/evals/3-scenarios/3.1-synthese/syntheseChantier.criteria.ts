import { judged, withBase } from "../criterion";

/** Les critères du scénario « Synthèse d'un chantier sur un territoire ». */
export const SYNTHESE_CHANTIER_CRITERIA = withBase({
  criteria: [
    judged({
      id: "Trois volets",
      rule: "Demande : synthèse du chantier, écart à la médiane, difficultés des commentaires",
      instruction:
        "Cherche dans la réponse un passage pour chacun des trois volets de la demande, et cite-les dans la preuve : (1) la situation du chantier sur le territoire demandé ; (2) son écart à la médiane ; (3) des difficultés tirées des commentaires. Un volet sans passage qui le traite est non conforme. La justesse du contenu de chaque volet relève d'autres critères.",
    }),
    judged({
      id: "Écart à la médiane chiffré",
      rule: "Demande : l'écart du chantier à la médiane",
      instruction:
        "L'écart du chantier à la médiane est ÉCRIT en points dans la réponse (« −15 points », « 15 points sous la médiane »). Un écart énoncé sans chiffre (« en retard sur la médiane ») est non conforme, même si les données reçues permettraient de le chiffrer.",
    }),
    judged({
      id: "Difficultés tirées des commentaires",
      rule: "Règle 2 : ne cite que des données reçues, commentaires compris",
      instruction:
        "Chaque difficulté citée provient des commentaires reçus (délais, postes vacants, fermetures de lignes…). Une difficulté qui n'y figure pas est non conforme. Ce critère ne juge que l'invention : l'absence de difficultés relève de « Trois volets », et reste conforme ici.",
    }),
  ],
});
