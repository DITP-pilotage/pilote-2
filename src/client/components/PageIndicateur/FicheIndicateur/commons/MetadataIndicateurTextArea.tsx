import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import TextArea from "@/components/_commons/TextArea/TextArea";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataIndicateurTextArea: FunctionComponent<{
  name:
    | "indicNom"
    | "commentaire"
    | "indicDescr"
    | "indicMethodeCalcul"
    | "indicSource";
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
  estEnCoursDeModification: boolean;
}> = ({ name, informationMetadataIndicateur, estEnCoursDeModification }) => {
  const form = useMetadataIndicateurForm();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        return (
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={informationMetadataIndicateur}
            valeurAffiché={field.value || "_"}
          >
            <TextArea
              erreurMessage={form.formState.errors[name]?.message}
              htmlName={name}
              onChange={field.onChange}
              value={field.value || ""}
            />
          </MetadataIndicateurChamp>
        );
      }}
    />
  );
};
