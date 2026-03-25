import { Dispatch, FunctionComponent, SetStateAction, useId } from "react";
import { PALETTE_DSFR } from "@/client/utils/couleur/paletteTerritoires";
import type { TerritoireEvolutionDonnees } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/types";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import {
  CheckboxGroupeStyled,
  LineChartLegendeStyled,
} from "./LineChartLegende.styled";

interface LineChartLegendeProps {
  tousLesIndicateursDetails: TerritoireEvolutionDonnees[];
  territoiresAAfficher: Record<string, boolean>;
  setTerritoiresAAfficher: Dispatch<Record<string, boolean>>;
  afficherLesCibles: boolean;
  setAfficherLesCibles: Dispatch<SetStateAction<boolean>>;
  periodeSelectionnee: string;
  changerLaPeriodeSelectionnee: (periode: string) => void;
  periodesSelectionnablesZoom: string[];
  afficherControls: boolean;
}

const LineChartLegende: FunctionComponent<LineChartLegendeProps> = ({
  tousLesIndicateursDetails,
  territoiresAAfficher,
  setTerritoiresAAfficher,
  afficherLesCibles,
  setAfficherLesCibles,
  periodeSelectionnee,
  changerLaPeriodeSelectionnee,
  periodesSelectionnablesZoom,
  afficherControls,
}) => {
  const id = useId();
  return (
    <LineChartLegendeStyled className="fr-mt-1w fr-ml-8w fr-mr-4w">
      {afficherControls ? (
        <div className="flex flex-col gap-2">
          <Interrupteur
            checked={afficherLesCibles}
            direction="inverse"
            libellé="afficher les valeurs cibles"
            onChange={() => setAfficherLesCibles(!afficherLesCibles)}
          />
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm">zoomer sur : </span>
            {periodesSelectionnablesZoom.map((periode) => (
              <button
                className={`fr-tag fr-mr-1w${periode === periodeSelectionnee ? " tag-selectionnee" : ""} min-h-0`}
                key={periode}
                onClick={() => changerLaPeriodeSelectionnee(periode)}
                type="button"
              >
                <p className="titre-ellipsis text-xs">{periode}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="fr-text fr-text--bold">Légende :</div>
      <div className="legend-checkbox-container">
        <div className="legend-content fr-mr-4w">
          <div className="legend-item fr-mb-1w">
            <div className="line-dashed fr-mr-2w" />
            <span>valeur cible</span>
          </div>
          <div className="legend-item">
            <div className="line-indicator fr-mr-2w" />
            <span>valeur de l'indicateur</span>
          </div>
        </div>
        <fieldset className="fr-fieldset" id={`legend-checkbox-${id}`}>
          {tousLesIndicateursDetails.map((indicateurDetail, index) => {
            return (
              <CheckboxGroupeStyled
                className="fr-fieldset__element fr-fieldset__element--inline fr-mb-1w"
                color={PALETTE_DSFR[index % PALETTE_DSFR.length]}
                key={indicateurDetail.territoireNom}
              >
                <div className="fr-checkbox-group fr-checkbox-group--sm">
                  <input
                    checked={
                      territoiresAAfficher[indicateurDetail.territoireNom]
                    }
                    id={`checkbox-${indicateurDetail.territoireNom}-${id}`}
                    name={`checkbox-${indicateurDetail.territoireNom}-${id}`}
                    onChange={() => {
                      setTerritoiresAAfficher({
                        ...territoiresAAfficher,
                        [indicateurDetail.territoireNom]:
                          !territoiresAAfficher[indicateurDetail.territoireNom],
                      });
                    }}
                    type="checkbox"
                  />
                  <label
                    className="fr-label"
                    htmlFor={`checkbox-${indicateurDetail.territoireNom}-${id}`}
                  >
                    {" "}
                    {indicateurDetail.territoireNom}
                  </label>
                </div>
              </CheckboxGroupeStyled>
            );
          })}
        </fieldset>
      </div>
    </LineChartLegendeStyled>
  );
};

export default LineChartLegende;
