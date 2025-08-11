import { Dispatch, FunctionComponent, SetStateAction } from "react";
import { PALETTE_DSFR } from "@/client/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/useIndicateurEvolutionNew";
import { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import {
  CheckboxGroupeStyled,
  LineChartLegendeStyled,
} from "./LineChartLegende.styled";

interface LineChartLegendeProps {
  tousLesIndicateursDetails: IndicateurDétailsParTerritoire[];
  territoiresAAfficher: Record<string, boolean>;
  setTerritoiresAAfficher: Dispatch<Record<string, boolean>>;
  afficherLesCibles: boolean;
  setAfficherLesCibles: Dispatch<SetStateAction<boolean>>;
}

const LineChartLegende: FunctionComponent<LineChartLegendeProps> = ({
  tousLesIndicateursDetails,
  territoiresAAfficher,
  setTerritoiresAAfficher,
  afficherLesCibles,
  setAfficherLesCibles,
}) => {
  return (
    <LineChartLegendeStyled className="fr-mt-1w fr-ml-4w">
      <Interrupteur
        auChangement={() => setAfficherLesCibles(!afficherLesCibles)}
        checked={afficherLesCibles}
        id="interrupteur-valeurs-cibles"
        libellé="afficher les valeurs cibles"
      />
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
        <fieldset className="fr-fieldset" id="legend-checkbox">
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
                    id={`checkbox-${indicateurDetail.territoireNom}`}
                    name={`checkbox-${indicateurDetail.territoireNom}`}
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
                    htmlFor={`checkbox-${indicateurDetail.territoireNom}`}
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
