import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { MetadataChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataChamp";
import Input from "@/components/_commons/Input/Input";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataInput: FunctionComponent<{
  htmlName:
    | "mailles"
    | "frequenceTerritoriale"
    | "adminSource"
    | "siSource"
    | "respDonnees"
    | "respDonneesEmail"
    | "contactTechnique"
    | "contactTechniqueEmail"
    | "indicUnite"
    | "indicNomBaro"
    | "indicDescrBaro"
    | "indicSourceUrl"
    | "delaiDisponibilite"
    | "reformePrioritaire"
    | "methodeCollecte"
    | "detailProjetAnnuelPerf"
    | "poidsPourcentDept"
    | "poidsPourcentReg"
    | "poidsPourcentNat"
    | "poidsPourcentEvalDept"
    | "poidsPourcentEvalReg"
    | "poidsPourcentEvalNat"
    | "modalitesDonneeOuverte";
  informationMetadataIndicateur: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
  valeurAffiché: string;
  disabled?: boolean;
}> = ({
  htmlName,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
  disabled = false,
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
            <Input
              disabled={disabled}
              erreurMessage={form.formState.errors[htmlName]?.message}
              htmlName={htmlName}
              onChange={field.onChange}
              type="text"
            />
          );
        }}
      />
    </MetadataChamp>
  );
};
