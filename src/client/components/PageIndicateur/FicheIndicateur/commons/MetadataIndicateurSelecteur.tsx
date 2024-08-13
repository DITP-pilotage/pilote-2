import { UseFormRegisterReturn } from 'react-hook-form';
import { FunctionComponent } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';

export const optionsBooleanSelecteur = [{ libellé: 'Oui', valeur: 'true' }, { libellé: 'Non', valeur: 'false' }];

export const MetadataIndicateurSelecteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  erreurMessage?: string,
  listeValeur: { valeur: string; libellé: string }[],
  register: UseFormRegisterReturn<string>,
  values: string | boolean,
  valeurAffiché: string,
}> = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  erreurMessage,
  listeValeur,
  register,
  values,
  valeurAffiché,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Sélecteur
        errorMessage={erreurMessage}
        htmlName='indicParentCh'
        options={listeValeur}
        register={register}
        valeurSélectionnée={`${values || '_'}`}
      />
    </MetadataIndicateurChamp>
  );
};
