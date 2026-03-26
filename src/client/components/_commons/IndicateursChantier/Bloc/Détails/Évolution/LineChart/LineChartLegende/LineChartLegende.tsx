import { Dispatch, FunctionComponent, SetStateAction, useId } from "react";
import { PALETTE_DSFR } from "@/client/utils/couleur/paletteTerritoires";
import { IndicateurDetailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { Checkbox } from "@/components/shared/Checkbox";
import { clsxm } from "@/utils/clsxm";

const PALETTE_CHECKBOX_CLASSES: Record<string, string> = {
  "#68A532":
    "data-[state=checked]:!bg-dsfr-green-bourgeon-main-640 data-[state=checked]:!border-dsfr-green-bourgeon-main-640",
  "#A558A0":
    "data-[state=checked]:!bg-dsfr-purple-glycine-main-494 data-[state=checked]:!border-dsfr-purple-glycine-main-494",
  "#417DC4":
    "data-[state=checked]:!bg-dsfr-blue-cumulus-main-526 data-[state=checked]:!border-dsfr-blue-cumulus-main-526",
  "#C8AA39":
    "data-[state=checked]:!bg-dsfr-yellow-tournesol-main-731 data-[state=checked]:!border-dsfr-yellow-tournesol-main-731",
  "#009081":
    "data-[state=checked]:!bg-dsfr-green-menthe-main-548 data-[state=checked]:!border-dsfr-green-menthe-main-548",
  "#E18B76":
    "data-[state=checked]:!bg-dsfr-pink-macaron-main-689 data-[state=checked]:!border-dsfr-pink-macaron-main-689",
  "#465F9D":
    "data-[state=checked]:!bg-dsfr-blue-ecume-main-400 data-[state=checked]:!border-dsfr-blue-ecume-main-400",
  "#C08C65":
    "data-[state=checked]:!bg-dsfr-brown-caramel-main-648 data-[state=checked]:!border-dsfr-brown-caramel-main-648",
  "#00A95F":
    "data-[state=checked]:!bg-dsfr-green-emeraude-main-632 data-[state=checked]:!border-dsfr-green-emeraude-main-632",
  "#E4794A":
    "data-[state=checked]:!bg-dsfr-orange-terre-battue-main-645 data-[state=checked]:!border-dsfr-orange-terre-battue-main-645",
  "#0078F3":
    "data-[state=checked]:!bg-dsfr-info-main-525 data-[state=checked]:!border-dsfr-info-main-525",
  "#D1B781":
    "data-[state=checked]:!bg-dsfr-brown-cafe-creme-main-782 data-[state=checked]:!border-dsfr-brown-cafe-creme-main-782",
  "#1F8D49":
    "data-[state=checked]:!bg-dsfr-green-foret data-[state=checked]:!border-dsfr-green-foret",
  "#CE614A":
    "data-[state=checked]:!bg-dsfr-pink-tuile-main-556 data-[state=checked]:!border-dsfr-pink-tuile-main-556",
  "#009099":
    "data-[state=checked]:!bg-dsfr-green-archipel-main-557 data-[state=checked]:!border-dsfr-green-archipel-main-557",
  "#AEA397":
    "data-[state=checked]:!bg-dsfr-beige-gris-galet-main-702 data-[state=checked]:!border-dsfr-beige-gris-galet-main-702",
};

interface LineChartLegendeProps {
  tousLesIndicateursDetails: IndicateurDetailsParTerritoire[];
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
    <div className="fr-mt-1w fr-ml-8w fr-mr-4w">
      {afficherControls ? (
        <div className="flex align-center">
          <Interrupteur
            checked={afficherLesCibles}
            direction="inverse"
            libellé="afficher les valeurs cibles"
            onChange={() => setAfficherLesCibles(!afficherLesCibles)}
          />
          <span className="fr-ml-4w fr-mr-1w">zoomer sur : </span>
          {periodesSelectionnablesZoom.map((periode) => (
            <button
              className={clsxm(
                "fr-tag fr-mr-1w",
                periode === periodeSelectionnee && "text-white bg-primary",
              )}
              key={periode}
              onClick={() => changerLaPeriodeSelectionnee(periode)}
              type="button"
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap fr-text--sm">
                {periode}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="fr-text fr-text--bold">Légende :</div>
      <div className="flex items-start">
        <div className="flex flex-col whitespace-nowrap fr-mr-4w">
          <div className="flex items-center fr-mb-1w">
            <div className="w-[50px] h-0 border-t-[3px] border-dashed border-[#999] fr-mr-2w" />
            <span>valeur cible</span>
          </div>
          <div className="flex items-center">
            <div className="w-[50px] h-[3px] bg-[#999] relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-2 after:bg-gray-500 after:rounded-full after:shadow-[0_0_2px_rgba(0,0,0,0.3)] fr-mr-2w" />
            <span>valeur de l'indicateur</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" id={`legend-checkbox-${id}`}>
          {tousLesIndicateursDetails.map((indicateurDetail, index) => {
            const color = PALETTE_DSFR[index % PALETTE_DSFR.length];
            const checkboxClass = PALETTE_CHECKBOX_CLASSES[color] ?? "";
            return (
              <label
                className="flex items-center gap-1.5 cursor-pointer text-sm"
                key={indicateurDetail.territoireNom}
              >
                <Checkbox
                  checked={territoiresAAfficher[indicateurDetail.territoireNom]}
                  className={checkboxClass}
                  onCheckedChange={() => {
                    setTerritoiresAAfficher({
                      ...territoiresAAfficher,
                      [indicateurDetail.territoireNom]:
                        !territoiresAAfficher[indicateurDetail.territoireNom],
                    });
                  }}
                />
                {indicateurDetail.territoireNom}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LineChartLegende;
