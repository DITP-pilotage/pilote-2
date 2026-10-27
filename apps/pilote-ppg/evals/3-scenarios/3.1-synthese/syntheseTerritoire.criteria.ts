import { mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkChantiersCited } from "../mechanicalChecks";
import { COMMENTAIRES_FIDELES } from "../criteria/commentaires";

/** Les critères du scénario « Synthèse d'un territoire ». */
export const SYNTHESE_TERRITOIRE_CRITERIA = withBase({
  criteria: [
    mechanical({
      id: "Chantiers attendus",
      rule: "Méthode, collecter : une synthèse de territoire couvre ses chantiers en retard et en difficulté",
      check: (evidence) =>
        checkChantiersCited({
          text: evidence.matter,
          chantiers: chantiersAttendus({
            truth: evidence.truth,
            view: "tous",
          }),
        }),
    }),
    COMMENTAIRES_FIDELES,
  ],
});
