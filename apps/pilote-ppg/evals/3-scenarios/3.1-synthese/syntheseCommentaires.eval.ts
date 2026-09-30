import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse des commentaires d'un/de plusieurs chantiers »
 * (coordinateur, à compléter) : « Synthétise les commentaires des chantiers
 * suivants CH-XXX, CH-YYY, notamment les principales actions identifiées ».
 *
 * Le message ne nomme pas de territoire : l'agent doit prendre le territoire
 * courant du contexte. Sur une région, seuls les commentaires territoriaux
 * sont visibles ; « actions à venir » et « actions à valoriser » sont des
 * types nationaux, signalés non accessibles. Le scénario demande donc des
 * actions que le coordinateur ne peut pas lire par ces types : la grille
 * exige que l'agent le dise, et qu'il tire les actions des commentaires
 * territoriaux.
 *
 * « Synthétise » est une demande explicite de reformulation : « Pas de
 * recopie » s'applique ici, alors que l'outil restitue sinon en verbatim.
 *
 * Référence observée le 2026-09-30 : outils 100 %, forme 86 %, fond 83 %.
 * Dans 3 essais sur 9, la réponse ne synthétise rien et se limite à dire
 * que les types d'actions sont inaccessibles. Passages recopiés dans
 * 5 essais sur 9.
 * Second run du 2026-09-30 : outils 100 %, forme 83 %, fond 94 %.
 */

const commentairesDe = (chantier_id: string) => ({
  toolName: "get_chantier_commentaires",
  input: { chantier_id, territoire_code: "REG-53" },
});

const MESSAGE = (chantiers: string) =>
  `Synthétise les commentaires des chantiers suivants ${chantiers}, notamment les principales actions identifiées`;

scenarioEval({
  suite: "Synthèse des commentaires d'un/de plusieurs chantiers",
  group: "synthese",
  grid: GRIDS.commentaires,
  profile: "coordinateur",
  cases: [
    {
      question: MESSAGE("CH-005, CH-006"),
      reason: "Deux chantiers commentés",
      truthScope: {
        territoires: ["REG-53"],
        chantiersCommentes: ["CH-005", "CH-006"],
      },
      expected: [commentairesDe("CH-005"), commentairesDe("CH-006")],
    },
    {
      question: MESSAGE("CH-001"),
      reason: "Un seul chantier",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-001"] },
      expected: [commentairesDe("CH-001")],
    },
    {
      question: MESSAGE("CH-005, CH-012"),
      reason:
        "CH-012 n'a aucun commentaire en Bretagne : à dire, sans inventer",
      truthScope: {
        territoires: ["REG-53"],
        chantiersCommentes: ["CH-005", "CH-012"],
      },
      expected: [commentairesDe("CH-005"), commentairesDe("CH-012")],
    },
  ],
});
