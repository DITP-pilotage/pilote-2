import { describe, expect, it } from "vitest";
import { getTypesContenuChantierPourTerritoire } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TypeContenuChantier } from "@/server/chantiers/query/GetChantierCommentairesQuery";

const tousLesTypes = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
  "commentaires_sur_les_donnees",
  "autres_resultats_obtenus",
  "synthese_des_resultats",
] satisfies TypeContenuChantier[];

describe("getTypesContenuChantierPourTerritoire", () => {
  it("retourne les types nationaux et la synthèse pour NAT-FR", () => {
    expect(
      getTypesContenuChantierPourTerritoire({
        territoireCode: "NAT-FR",
        types: tousLesTypes,
      }),
    ).toEqual([
      "freins_a_lever",
      "actions_a_venir",
      "actions_a_valoriser",
      "autres_resultats_obtenus_non_correles_aux_indicateurs",
      "decision_strategique",
      "synthese_des_resultats",
    ]);
  });

  it("retourne les types territoriaux et la synthèse pour une maille locale", () => {
    expect(
      getTypesContenuChantierPourTerritoire({
        territoireCode: "REG-53",
        types: tousLesTypes,
      }),
    ).toEqual([
      "commentaires_sur_les_donnees",
      "autres_resultats_obtenus",
      "synthese_des_resultats",
    ]);
  });
});
