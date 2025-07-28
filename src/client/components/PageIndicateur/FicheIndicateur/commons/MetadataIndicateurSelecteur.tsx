import { UseFormRegisterReturn } from "react-hook-form";
import { FunctionComponent } from "react";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";

export const MetadataIndicateurSelecteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
  estEnCoursDeModification: boolean;
  erreurMessage?: string;
  listeValeur: { valeur: string; libellé: string }[];
  register?: UseFormRegisterReturn<string>;
  values: string | boolean;
  valeurAffiché: string;
  estDesactive?: boolean;
  valeurModifiéeCallback?: (valeur: string) => void;
  estMandatory?: boolean;
}> = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  erreurMessage,
  listeValeur,
  register,
  values,
  valeurAffiché,
  estDesactive,
  valeurModifiéeCallback,
  estMandatory = informationMetadataIndicateur.metaPiloteMandatory,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      estMandatory={estMandatory}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Sélecteur
        errorMessage={erreurMessage}
        estDesactive={estDesactive}
        htmlName="indicParentCh"
        options={listeValeur}
        register={register}
        valeurModifiéeCallback={valeurModifiéeCallback}
        valeurSélectionnée={`${values || "_"}`}
      />
    </MetadataIndicateurChamp>
  );
};
