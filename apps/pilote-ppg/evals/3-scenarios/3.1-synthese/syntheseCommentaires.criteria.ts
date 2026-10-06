import { judged, withBase } from "../criterion";
import { PAS_DE_RECOPIE } from "../criteria/commentaires";

/** Les critères du scénario « Synthèse des commentaires ». */
export const SYNTHESE_COMMENTAIRES_CRITERIA = withBase({
  criteria: [
    judged({
      id: "Une synthèse par chantier",
      rule: "Demande : synthétise les commentaires de chaque chantier cité",
      instruction:
        "Chaque chantier de la demande a sa propre synthèse, au format CH-XXX — Nom. Pour un chantier dont les données reçues ne contiennent AUCUN commentaire, la réponse dit qu'il n'y en a pas : lui attribuer un contenu, quel qu'il soit, est non conforme.",
    }),
    judged({
      id: "Actions identifiées",
      rule: "Demande : notamment les principales actions identifiées",
      instruction:
        "Les actions citées (recrutements, ouvertures, campagnes…) proviennent des commentaires reçus. Si les données reçues signalent des types non accessibles, la réponse dit que ces informations relèvent de la vue nationale, et non qu'il n'y en a pas.",
    }),
    PAS_DE_RECOPIE,
    judged({
      id: "Doublons compactés",
      rule: "Demande : synthétise les commentaires",
      instruction:
        "Quand plusieurs commentaires reçus pour un même chantier disent la même chose, la synthèse l'énonce une seule fois. Une même information répétée sous un chantier, même reformulée, est non conforme. Si les commentaires reçus ne se recoupent pas, ce critère est conforme.",
    }),
  ],
});
