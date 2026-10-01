import type { TerritoireRef } from "../seeds";
import { BRETAGNE } from "../world";

/**
 * Les territoires que les scénarios peuplent. Au-delà de la Bretagne :
 * ses départements pour les comparaisons région / départements, les Pays de
 * la Loire comme région de comparaison hors du périmètre du coordinateur, et
 * le couple REG-84 / DEPT-84 pour le piège du « 84 » (tout code de région est
 * aussi un numéro de département).
 *
 * `code_insee` et `zone_id` relevés dans la table `territoire` de la base de
 * test.
 */
export const TERRITOIRES = {
  bretagne: BRETAGNE,
  cotesDArmor: {
    territoire_code: "DEPT-22",
    code_insee: "22",
    maille: "DEPT",
    zone_id: "D22",
  },
  finistere: {
    territoire_code: "DEPT-29",
    code_insee: "29",
    maille: "DEPT",
    zone_id: "D29",
  },
  illeEtVilaine: {
    territoire_code: "DEPT-35",
    code_insee: "35",
    maille: "DEPT",
    zone_id: "D35",
  },
  morbihan: {
    territoire_code: "DEPT-56",
    code_insee: "56",
    maille: "DEPT",
    zone_id: "D56",
  },
  paysDeLaLoire: {
    territoire_code: "REG-52",
    code_insee: "52",
    maille: "REG",
    zone_id: "R52",
  },
  auvergneRhoneAlpes: {
    territoire_code: "REG-84",
    code_insee: "84",
    maille: "REG",
    zone_id: "R84",
  },
  vaucluse: {
    territoire_code: "DEPT-84",
    code_insee: "84",
    maille: "DEPT",
    zone_id: "D84",
  },
} satisfies Record<string, TerritoireRef>;

export const JALON_COURANT = 2025;
