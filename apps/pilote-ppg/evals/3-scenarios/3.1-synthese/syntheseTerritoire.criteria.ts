import { judged, mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkChantiersCited } from "../mechanicalChecks";
import { COMMENTAIRES_DU_GABARIT } from "../criteria/commentaires";

/** Les critères du scénario « Synthèse d'un territoire ». */
export const SYNTHESE_TERRITOIRE_CRITERIA = withBase({
  criteria: [
    mechanical({
      id: "Chantiers attendus",
      rule: "Workflow a : les chantiers en retard et en difficulté du territoire",
      check: (evidence) =>
        checkChantiersCited({
          text: evidence.matter,
          chantiers: chantiersAttendus({
            truth: evidence.truth,
            view: "tous",
          }),
        }),
    }),
    judged({
      id: "Écart et météo",
      rule: "Gabarit mono_territoire : écart en points et météo pour chaque chantier",
      instruction:
        "Chaque chantier listé porte son écart en points et sa météo, et cette météo est celle que la fiche lui donne (NUAGE se lit « Appuis nécessaires », ORAGE « Objectifs compromis », COUVERT « Objectifs atteignables », SOLEIL « Objectifs sécurisés »). Un écart ou une météo absents sous un chantier sont non conformes, même s'ils sont cités ailleurs. L'écriture de la météo (code ou libellé) et l'exactitude des chiffres relèvent d'autres critères.",
    }),
    ...COMMENTAIRES_DU_GABARIT,
  ],
});
