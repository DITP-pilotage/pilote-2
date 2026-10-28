import { BASE_IDS, mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkHasTable, checkTableChantiers } from "../mechanicalChecks";

/** Les critères du scénario « Tableau demandé ». */
export const TABLEAU_DEMANDE_CRITERIA = withBase({
  // Dans un tableau, le code et le nom d'un chantier peuvent occuper deux
  // colonnes : le format CH-XXX — Nom vaut pour la prose.
  omit: [BASE_IDS.chantierFormat],
  criteria: [
    mechanical({
      id: "Tableau",
      rule: "Forme : la demande explicite prime sur les formats par défaut (PIL-1900)",
      check: (evidence) => checkHasTable({ text: evidence.matter }),
    }),
    mechanical({
      id: "Chantiers en retard dans le tableau",
      rule: "Demande : les chantiers en retard du territoire",
      check: (evidence) =>
        checkTableChantiers({
          text: evidence.matter,
          chantierIds: chantiersAttendus({
            truth: evidence.truth,
            view: "en_retard",
          }).map((chantier) => chantier.id),
        }),
    }),
  ],
});
