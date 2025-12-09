import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import Input from "@/components/_commons/Input/Input";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataIndicateurInput: FunctionComponent<{
  erreurMessage?: string;
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
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
  estEnCoursDeModification: boolean;
  valeurAffiché: string;
  disabled?: boolean;
}> = ({
  erreurMessage,
  htmlName,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
  disabled = false,
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
            <Input
              disabled={disabled}
              erreurMessage={erreurMessage}
              htmlName={htmlName}
              onChange={field.onChange}
              type="text"
            />
          );
        }}
      />
    </MetadataIndicateurChamp>
  );
};
