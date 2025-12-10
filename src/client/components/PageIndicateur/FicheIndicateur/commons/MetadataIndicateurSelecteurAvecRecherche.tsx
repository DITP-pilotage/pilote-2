import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { InformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import SélecteurAvecRecherche from "@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

export const MetadataIndicateurSelecteurAvecRecherche: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat;
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
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
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
    </MetadataIndicateurChamp>
  );
};
