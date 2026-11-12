import { withBase } from "../criterion";
import { ABSENCE_DITE, PERSONNES_ATTENDUES } from "../criteria/personnes";

/** Les critères du scénario « Personnes citées ». */
export const PERSONNES_CITEES_CRITERIA = withBase({
  criteria: [PERSONNES_ATTENDUES, ABSENCE_DITE],
});
