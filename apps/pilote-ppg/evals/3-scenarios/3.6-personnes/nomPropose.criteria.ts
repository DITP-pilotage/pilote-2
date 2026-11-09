import { withBase } from "../criterion";
import { NOM_NON_AFFIRME, PERSONNES_ATTENDUES } from "../criteria/personnes";

/** Les critères du scénario « Nom proposé par l'utilisateur ». */
export const NOM_PROPOSE_CRITERIA = withBase({
  criteria: [PERSONNES_ATTENDUES, NOM_NON_AFFIRME],
});
