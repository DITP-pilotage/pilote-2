import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { MetadataChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataChamp";
import Interrupteur from "@/components/_commons/Interrupteur/Interrupteur";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataInterrupteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataContrat;
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
    <MetadataChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadata={informationMetadataIndicateur}
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
    </MetadataChamp>
  );
};
