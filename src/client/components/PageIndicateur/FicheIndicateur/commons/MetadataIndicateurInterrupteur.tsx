import { UseFormRegisterReturn } from 'react-hook-form';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';

export const MetadataIndicateurInterrupteur = ({
  informationMetadataIndicateur,
  estEnCoursDeModification,
  htmlName,
  register,
  isChecked,
  valeurAffiché,
}: {
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  htmlName: string,
  register: UseFormRegisterReturn<string>,
  isChecked: boolean,
  valeurAffiché: string,
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
        libellé=''
        register={register}
      />
    </MetadataIndicateurChamp>
  );
};
