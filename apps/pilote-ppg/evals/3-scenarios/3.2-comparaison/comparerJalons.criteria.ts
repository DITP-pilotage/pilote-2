import { BASE_IDS, judged, withBase } from "../criterion";

/** Les critères du scénario « Comparer les taux entre deux jalons ». */
export const COMPARER_JALONS_CRITERIA = withBase({
  omit: [BASE_IDS.restriction],
  criteria: [
    judged({
      id: "Évolution entre jalons",
      rule: "Rédiger : comparaison de jalons, l'évolution entre les jalons",
      instruction:
        "Un taux « - % » ou null dans les données reçues signifie qu'il n'y a PAS de données pour ce jalon : dans ce cas, ce critère est conforme sans autre vérification. Si les deux jalons ont un taux chiffré, la réponse donne le taux à chaque jalon et l'évolution en points, avec le bon sens : hausse si le taux du jalon le plus récent est plus élevé, baisse sinon.",
    }),
    judged({
      id: "Données indisponibles dites",
      rule: "Règle 2 : une donnée absente se dit, y compris pour un jalon sans données",
      instruction:
        "Un taux « - % » ou null dans les données reçues signifie qu'il n'y a pas de données pour ce jalon. Dans ce cas, la réponse le dit explicitement ; la passer sous silence ou afficher une valeur est non conforme. Si les deux jalons ont un taux chiffré, ce critère est conforme.",
    }),
  ],
});
