import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { MetadataChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataChamp";
import TextArea from "@/components/_commons/TextArea/TextArea";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataTextArea: FunctionComponent<{
  name:
    | "indicNom"
    | "commentaire"
    | "indicDescr"
    | "indicMethodeCalcul"
    | "indicSource";
  informationMetadataIndicateur: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
}> = ({ name, informationMetadataIndicateur, estEnCoursDeModification }) => {
  const form = useMetadataIndicateurForm();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        return (
          <MetadataChamp
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadata={informationMetadataIndicateur}
            valeurAffiché={field.value || "_"}
          >
            <TextArea
              erreurMessage={form.formState.errors[name]?.message}
              htmlName={name}
              onChange={field.onChange}
              value={field.value || ""}
            />
          </MetadataChamp>
        );
      }}
    />
  );
};
