import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { InformationMetadataContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { MetadataChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataChamp";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataSelecteurAvecRecherche: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataContrat;
  estEnCoursDeModification: boolean;
  name: "indicParentCh";
  listeValeur: { valeur: string; libellé: string }[];
  valeurAffiché: string;
}> = ({
  informationMetadataIndicateur,
  name,
  estEnCoursDeModification,
  listeValeur,
  valeurAffiché,
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
        name={name}
        render={({ field }) => {
          return (
            <SélecteurAvecRecherche
              erreurMessage={form.formState.errors[name]?.message}
              estVisibleEnMobile
              estVueMobile={false}
              htmlName="indicParentCh"
              options={listeValeur}
              valeurModifiéeCallback={field.onChange}
              valeurSélectionnée={field.value || "_"}
            />
          );
        }}
      />
    </MetadataChamp>
  );
};
