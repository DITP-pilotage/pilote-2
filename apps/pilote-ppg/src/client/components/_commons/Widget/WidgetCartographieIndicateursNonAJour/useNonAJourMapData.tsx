import { useMemo } from "react";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import {
  formatDateDerniereValeur,
  formatEtatIndicateur,
  formatMiseAJourAttendueDepuis,
  formatNbIndicateursNonAJour,
  getFill,
  isChantierMode,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";

const TooltipContent = ({ territoire }: { territoire: TerritoireNonAJour }) => {
  if (isChantierMode(territoire)) {
    return (
      <div className="font-bold">{formatNbIndicateursNonAJour(territoire)}</div>
    );
  }
  if (!territoire.estApplicable || territoire.estAJour) {
    return <div className="font-bold">{formatEtatIndicateur(territoire)}</div>;
  }
  return (
    <div>
      <div className="font-bold">{formatEtatIndicateur(territoire)}</div>
      <div>Dernière valeur : {formatDateDerniereValeur(territoire)}</div>
      <div>
        Mise à jour attendue depuis :{" "}
        {formatMiseAJourAttendueDepuis(territoire)}
      </div>
    </div>
  );
};

export const useNonAJourMapData = (
  territoires: TerritoireNonAJour[],
  mode: NonAJourMode,
) =>
  useMemo(
    () =>
      Object.fromEntries(
        territoires.map((territoire) => [
          territoire.territoireCode,
          {
            remplissage: getFill(territoire, mode),
            libelle: getLabelTerritoire(territoire.territoireCode),
            contenuInfoBulle: <TooltipContent territoire={territoire} />,
          } satisfies CartographieV2Donnee,
        ]),
      ),
    [territoires, mode],
  );
