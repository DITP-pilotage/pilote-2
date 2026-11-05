import { scenarioEval } from "../scenarioEval";
import { seedValeursACompleter } from "./seedValeursACompleter";
import { VALEURS_A_COMPLETER_CRITERIA } from "./valeursACompleter.criteria";

/**
 * Scénario « Valeurs à compléter » (recette de la récap VA / VI / VC).
 *
 * Critères visés : des territoires additionnés d'un indicateur à l'autre, une
 * maille à zéro dite « aucune donnée », des motifs définis de travers, puis,
 * pour la réponse en deux temps (en bref puis tableau du détail) : un nombre
 * de territoires pour un seul territoire, une liste au-delà du seuil, un
 * territoire hors demande, un tableau non introduit. Les quatre derniers
 * critères restent neutres tant qu'aucune sortie d'outil n'a de champ en_bref.
 *
 * Aucune attente d'outil : le scénario juge la réponse écrite, et tourne à
 * l'identique avec les deux outils d'origine et avec l'outil unique.
 *
 * Référence observée le 2026-11-05 sur dev, avec les deux outils d'origine
 * (3 essais par cas, 6 cas) : N3 96,1 %. Autres suites : valeurs
 * d'avancement non à jour 95,8 %, valeurs initiales et cibles manquantes
 * 94,9 %, clarifyWithChoices 95,2 % (sous 2/3 : « Quels sont les indicateurs
 * du chantier sur le handicap… », « Quelles valeurs d'avancement ne sont pas à
 * jour ? »), getIndicateurs 100 %, getChantiers 100 %, getChantiersSignales
 * 90,9 %.
 */

scenarioEval({
  suite: "Valeurs à compléter",
  group: "forme",
  criteria: VALEURS_A_COMPLETER_CRITERIA,
  profile: "coordinateur",
  seedSupplementaire: seedValeursACompleter,
  cases: [
    {
      question:
        "Fais-moi un récapitulatif chantier par chantier des mises à jour nécessaires : VA, VI et VC avec le détail des territoires concernés",
      reason:
        "Les trois types sont nommés : pas de clarification, un total par chantier à ne pas additionner",
      truthScope: { territoires: ["REG-53"] },
    },
    {
      history: [
        "Liste les indicateurs à mettre à jour sur le CH-007 et donne le nombre de régions et de départements concernés.",
      ],
      question:
        "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-007",
      reason:
        "CH-007 n'a de lignes qu'en région : la maille départementale est à zéro, à dire comme telle",
      truthScope: { territoires: ["REG-53"] },
    },
    {
      history: ["Quels sont les chantiers à mettre à jour ?"],
      question:
        "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes",
      reason:
        "Le premier tour clarifie, la réponse porte sur tout le périmètre : motifs à définir",
      truthScope: { territoires: ["REG-53"] },
    },
    {
      history: ["Le CH-018 est-il à jour en Bretagne ?"],
      question:
        "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-018 en REG-53",
      reason: "Un chantier, une région : pas de total au-delà de ce territoire",
      truthScope: { territoires: ["REG-53"] },
    },
    {
      history: ["Quelles valeurs d'avancement ne sont pas à jour ?"],
      question: "Et pour le CH-005 en détail ?",
      reason:
        "Suivi sur un chantier du premier tour : le détail est donné au même niveau pour tous les motifs",
      truthScope: { territoires: ["REG-53"] },
    },
    {
      history: ["Qu'est-ce que je dois mettre à jour dans le Finistère ?"],
      question:
        "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes en DEPT-29",
      reason:
        "Un seul territoire : chantiers et indicateurs par motif, aucun nombre de territoires",
      truthScope: { territoires: ["REG-53"] },
    },
  ],
});
