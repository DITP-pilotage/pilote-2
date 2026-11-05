import { BASE_IDS, judged, withBase } from "../criterion";

const NEUTRE_SANS_PERIMETRE =
  "Si aucune sortie d'outil ne contient le champ `perimetre`, ce critère est conforme. ";

/**
 * Les critères du scénario « Valeurs à compléter » : les défauts de la recette
 * et ceux de la réponse en deux temps (résumé puis tableau du détail). Ils
 * jugent la réponse écrite sur les chiffres et les définitions de la sortie
 * des outils, sans présumer de l'outil appelé.
 */
export const VALEURS_A_COMPLETER_CRITERIA = withBase({
  // Dans un tableau, le code et le nom d'un chantier peuvent occuper deux
  // colonnes : le format CH-XXX — Nom vaut pour la prose.
  omit: [BASE_IDS.chantierFormat],
  criteria: [
    judged({
      id: "Périmètre cité",
      rule: "Recette : la réponse dit sur quel périmètre portent ses chiffres",
      instruction:
        "La réponse dit sur quel périmètre portent ses chiffres (tout le périmètre de l'utilisateur, un chantier, un territoire). Des chiffres donnés sans périmètre sont non conformes.",
    }),
    judged({
      id: "Pas de somme entre indicateurs",
      rule: "Recette : un territoire concerné par plusieurs indicateurs ne compte qu'une fois",
      instruction:
        "Aucun nombre de territoires annoncé pour un chantier ou pour une maille ne dépasse le nombre de territoires distincts de la sortie de l'outil, et aucun total ne dépasse 120 territoires. Tout nombre de territoires annoncé doit figurer dans la sortie de l'outil. Un nombre obtenu en additionnant, indicateur par indicateur, les territoires concernés (un même territoire compté plusieurs fois) est non conforme : cite-le dans la preuve.",
    }),
    judged({
      id: "Mailles à zéro",
      rule: "Recette : une maille sans territoire concerné n'est pas une donnée absente",
      instruction:
        "Quand la demande porte sur une maille (régions, départements, national) sans territoire concerné, la réponse dit « 0 » ou « aucun territoire à mettre à jour » pour cette maille. Dire « aucune donnée disponible » ou « aucune donnée » pour elle est non conforme. Si aucune maille sans territoire concerné n'est en jeu, ce critère est conforme.",
    }),
    judged({
      id: "Motifs justes",
      rule: "Recette : un motif défini l'est comme dans la sortie de l'outil",
      instruction:
        "Un motif défini dans la réponse l'est comme suit : pour la valeur d'avancement, date de prochaine mise à jour dépassée ou aucune valeur ; pour la valeur initiale ou cible, valeur manquante, avec le jalon pour la cible. Un motif défini autrement est non conforme. Un motif cité sans définition est conforme.",
    }),
    judged({
      id: "Un seul territoire",
      rule: "Réponse en bref : pas de nombre de territoires pour un seul territoire",
      instruction:
        NEUTRE_SANS_PERIMETRE +
        "Le `perimetre` de la sortie de l'outil désigne-t-il un seul territoire (un département, ou une région sans ses départements) ? Si oui, la réponse ne donne aucun nombre de territoires. Sinon, ce critère est conforme.",
    }),
    judged({
      id: "Aucun territoire hors demande",
      rule: "Réponse en bref : aucun territoire nommé hors de la demande",
      instruction:
        NEUTRE_SANS_PERIMETRE +
        "La réponse ne nomme aucun territoire absent de la demande. Nommer un territoire que l'utilisateur n'a pas demandé est non conforme.",
    }),
    judged({
      id: "Tableau introduit",
      rule: "Réponse en bref : une phrase renvoie au tableau du détail",
      instruction:
        NEUTRE_SANS_PERIMETRE +
        "Si l'outil a renvoyé des valeurs à compléter, la réponse se termine par une phrase qui renvoie au tableau du détail. Sans renvoi au tableau, ce critère est non conforme. Si l'outil n'a renvoyé aucune valeur à compléter, ce critère est conforme.",
    }),
  ],
});
