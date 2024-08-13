import { UseFormRegisterReturn } from 'react-hook-form';
import { FunctionComponent } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';

export const MetadataIndicateurInterrupteur: FunctionComponent<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  htmlName: string,
  register: UseFormRegisterReturn<string>,
  isChecked: boolean,
  valeurAffiché: string,
}> = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  htmlName,
  register,
  isChecked,
  valeurAffiché,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Interrupteur
        checked={isChecked}
        id={htmlName}
        libellé={isChecked ? 'Oui' : 'Non'}
        register={register}
      />
    </MetadataIndicateurChamp>
  );
};
