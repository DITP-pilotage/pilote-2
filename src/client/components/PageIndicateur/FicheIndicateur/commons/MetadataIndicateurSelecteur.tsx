import { Controller } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataIndicateurSelecteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
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
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      estMandatory={estMandatory}
      informationMetadataIndicateur={informationMetadataIndicateur}
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
              options={listeValeur}
              valeurModifiéeCallback={(value) => {
                field.onChange(value);
                if (onChangeSideEffect) {
                  onChangeSideEffect(value);
                }
              }}
              valeurSélectionnée={`${field.value || "_"}`}
            />
          );
        }}
      />
    </MetadataIndicateurChamp>
  );
};
