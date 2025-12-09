import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataIndicateurInterrupteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
  estEnCoursDeModification: boolean;
  htmlName:
    | "indicIsPerseverant"
    | "indicIsPhare"
    | "indicIsBaro"
    | "projetAnnuelPerf"
    | "indicTerritorialise"
    | "donneeOuverte"
    | "cibleAttendue";
  valeurAffiché: string;
  onChangeSideEffect?: (isChecked: boolean) => void;
}> = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  htmlName,
  valeurAffiché,
  onChangeSideEffect,
}) => {
  const form = useMetadataIndicateurForm();
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Controller
        control={form.control}
        name={htmlName}
        render={({ field }) => {
          return (
            <Interrupteur
              checked={field.value}
              libellé={field.value ? "Oui" : "Non"}
              onChange={(isChecked) => {
                field.onChange(isChecked);
                if (onChangeSideEffect) {
                  onChangeSideEffect(isChecked);
                }
              }}
            />
          );
        }}
      />
    </MetadataIndicateurChamp>
  );
};
