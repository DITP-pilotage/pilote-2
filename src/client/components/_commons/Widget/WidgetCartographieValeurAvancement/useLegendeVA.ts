import { useMemo } from "react";
import { ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE } from "@/client/constants/légendes/élémentsDeLégendesCartographieValeurAvancement";
import {
  valeurMaximum,
  valeurMinimum,
} from "@/client/utils/statistiques/statistiques";
import { ValeurAvancementIndicateurTerritoire } from "./types";

const COULEUR_DÉPART = "#8bcdb1";
const COULEUR_ARRIVÉE = "#083a25";

export const useLegendeVA = (
  territoires: ValeurAvancementIndicateurTerritoire[],
  unite: string | null,
) => {
  return useMemo(() => {
    const tousApplicables = territoires.every(
      (territoire) => territoire.estApplicable,
    );
    const tousNonNull = territoires.every(
      (territoire) => territoire.valeurAvancement !== null,
    );

    let legendeAffichee = Object.values(ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE);

    if (tousApplicables) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire où le chantier prioritaire ne s'applique pas",
      );
    }

    if (tousNonNull) {
      legendeAffichee = legendeAffichee.filter(
        (el) =>
          el.libellé !==
          "Territoire pour lequel la donnée n'est pas renseignée/disponible",
      );
    }

    const valeurs = territoires.map(
      (territoire) => territoire.valeurAvancement,
    );
    const valeurMin = valeurMinimum(valeurs);
    const valeurMax = valeurMaximum(valeurs);

    return {
      items: legendeAffichee.map(({ remplissage, libellé }) => ({
        libellé,
        remplissage,
      })),
      degrade: {
        libellé:
          unite === null || unite === undefined
            ? ""
            : `En ${unite.toLocaleLowerCase()}`,
        valeurMin: valeurMin !== null ? valeurMin.toLocaleString() : "-",
        valeurMax: valeurMax !== null ? valeurMax.toLocaleString() : "-",
        couleurMin: COULEUR_DÉPART,
        couleurMax: COULEUR_ARRIVÉE,
      },
    };
  }, [territoires, unite]);
};
