import { ReactNode, useMemo } from "react";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { determinerRemplissageMeteo } from "@/client/utils/meteo/determinerRemplissageMeteo";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";

export const useDonneesCartographie = (
  territoiresMeteo: MeteoTerritoireViewModel[],
) => {
  return useMemo(() => {
    return territoiresMeteo.reduce(
      (acc, territoire) => {
        const meteo = territoire.meteo;
        return {
          ...acc,
          [territoire.territoireCode]: {
            remplissage: determinerRemplissageMeteo(
              meteo,
              ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
              territoire.estApplicable,
            ),
            libelle: getLabelTerritoire(territoire.territoireCode),
            contenuInfoBulle: (
              <div className="fr-text--bold">
                {territoire.estApplicable === false
                  ? "Non applicable"
                  : libellesMeteos[meteo]}
              </div>
            ),
          },
        };
      },
      {} as Record<
        string,
        { remplissage: string; libelle: string; contenuInfoBulle?: ReactNode }
      >,
    );
  }, [territoiresMeteo]);
};
