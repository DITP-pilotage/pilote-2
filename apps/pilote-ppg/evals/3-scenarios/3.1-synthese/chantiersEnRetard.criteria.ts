import { judged, mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkChantiersCited } from "../mechanicalChecks";

/** Les critères du scénario « Chantiers en retard et leurs indicateurs ». */
export const CHANTIERS_EN_RETARD_CRITERIA = withBase({
  criteria: [
    mechanical({
      id: "Chantiers en retard cités",
      rule: "Format des chantiers : chaque chantier au format CH-XXX — Nom",
      check: (evidence) =>
        checkChantiersCited({
          text: evidence.matter,
          chantiers: chantiersAttendus({
            truth: evidence.truth,
            view: "en_retard",
          }),
        }),
    }),
    judged({
      id: "Écart par chantier",
      rule: "get_chantiers en_retard : indique l'écart par rapport à la médiane (en points) et la météo",
      instruction:
        "Chaque chantier en retard porte son écart à la médiane en points et le libellé de sa météo. L'exactitude des chiffres relève de « Chiffres exacts ».",
    }),
    judged({
      id: "Valeurs des indicateurs",
      rule: "Demande : les valeurs des indicateurs de chaque chantier en retard (VI, VA, VC, TA)",
      instruction:
        "Pour chaque chantier en retard, la réponse DONNE les valeurs de ses indicateurs (valeur initiale, actuelle, cible, taux d'avancement). Renvoyer vers un tableau de bord ou dire que l'affichage est impossible est non conforme. L'exactitude des valeurs relève de « Chiffres exacts », pas de ce critère.",
    }),
  ],
});
