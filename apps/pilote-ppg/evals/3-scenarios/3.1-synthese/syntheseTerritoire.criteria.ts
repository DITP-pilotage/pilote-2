import { mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkChantiersCited } from "../mechanicalChecks";
import { COMMENTAIRES_FIDELES } from "../criteria/commentaires";

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
    COMMENTAIRES_FIDELES,
  ],
});
