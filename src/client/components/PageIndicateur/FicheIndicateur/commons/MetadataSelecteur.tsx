import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { MetadataChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataSelecteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
  name:
    | "viDeptFrom"
    | "vaDeptFrom"
    | "vcDeptFrom"
    | "viDeptOp"
    | "vaDeptOp"
    | "vcDeptOp"
    | "viNatFrom"
    | "vaNatFrom"
    | "vcNatFrom"
    | "viNatOp"
    | "vaNatOp"
    | "vcNatOp"
    | "viRegFrom"
    | "vaRegFrom"
    | "vcRegFrom"
    | "viRegOp"
    | "vaRegOp"
    | "vcRegOp"
    | "indicSchema"
    | "indicParentIndic"
    | "zgApplicable"
    | "periodicite"
    | "maillePilotage"
    | "couvertureTemporelle"
    | "paramVacaDecumulFrom"
    | "paramVacaPartitionDate"
    | "paramVacaOp"
    | "paramVacgDecumulFrom"
    | "paramVacgPartitionDate"
    | "paramVacgOp"
    | "tendance"
    | "indicType";
  listeValeur: { valeur: string; libellé: string }[];
  valeurAffiché: string;
  estDesactive?: boolean;
  estMandatory?: boolean;
  onChangeSideEffect?: (value: string) => void;
}> = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  listeValeur,
  name,
  valeurAffiché,
  estDesactive,
  estMandatory = informationMetadataIndicateur.metaPiloteMandatory,
  onChangeSideEffect,
}) => {
  const form = useMetadataIndicateurForm();

  return (
    <MetadataChamp
      estEnCoursDeModification={estEnCoursDeModification}
      estMandatory={estMandatory}
      informationMetadata={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => {
          return (
            <Sélecteur
              errorMessage={form.formState.errors[name]?.message}
              estDesactive={estDesactive}
              htmlName={name}
              onChange={(value) => {
                field.onChange(value);
                if (onChangeSideEffect) {
                  onChangeSideEffect(value);
                }
              }}
              options={listeValeur}
              valeurSélectionnée={field.value || "_"}
            />
          );
        }}
      />
    </MetadataChamp>
  );
};
