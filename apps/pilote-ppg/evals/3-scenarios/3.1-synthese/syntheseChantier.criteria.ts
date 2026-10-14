import { judged, withBase } from "../criterion";

/** Les critères du scénario « Synthèse d'un chantier sur un territoire ». */
export const SYNTHESE_CHANTIER_CRITERIA = withBase({
  criteria: [
    judged({
      id: "Trois volets",
      rule: "Demande : synthèse du chantier, position face aux autres territoires, difficultés des commentaires",
      instruction:
        "Cherche dans la réponse un passage pour chacun des trois volets de la demande, et cite-les dans la preuve : (1) la situation du chantier sur le territoire demandé ; (2) sa position face à au moins un autre territoire ; (3) des difficultés tirées des commentaires. Un volet sans passage qui le traite est non conforme. La justesse du contenu de chaque volet relève d'autres critères.",
    }),
    judged({
      id: "Situé face aux autres territoires",
      rule: "Comparer des territoires entre eux",
      instruction:
        "Le chantier est situé face à au moins un autre territoire avec des valeurs chiffrées (taux ou écart) ÉCRITES dans la réponse. Une position énoncée sans chiffre (« derrière », « devant ») est non conforme, même si les données reçues permettraient de la chiffrer.",
    }),
    judged({
      id: "Difficultés tirées des commentaires",
      rule: "Commentaires : extrais les idées clés sans interprétation",
      instruction:
        "Chaque difficulté citée provient des commentaires reçus (délais, postes vacants, fermetures de lignes…). Une difficulté qui n'y figure pas est non conforme. Ce critère ne juge que l'invention : l'absence de difficultés relève de « Trois volets », et reste conforme ici.",
    }),
  ],
});
