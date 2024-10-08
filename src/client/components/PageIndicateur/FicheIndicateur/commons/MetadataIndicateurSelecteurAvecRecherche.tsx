import { FunctionComponent } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import SélecteurAvecRecherche from '@/components/_commons/SélecteurAvecRecherche/SélecteurAvecRecherche';

export const MetadataIndicateurSelecteurAvecRecherche: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  erreurMessage?: string,
  listeValeur: { valeur: string; libellé: string }[],
  values: string | boolean,
  valeurAffiché: string,
  valeurModifiéeCallback: (chantierSelectionné: string) => void
}> = ({
  informationMetadataIndicateur,
  erreurMessage,
  estEnCoursDeModification,
  listeValeur,
  values,
  valeurAffiché,
  valeurModifiéeCallback,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <SélecteurAvecRecherche
        erreurMessage={erreurMessage}
        estVisibleEnMobile
        estVueMobile={false}
        htmlName='indicParentCh'
        options={listeValeur}
        valeurModifiéeCallback={valeurModifiéeCallback}
        valeurSélectionnée={`${values || '_'}`}
      />
    </MetadataIndicateurChamp>
  );
};
