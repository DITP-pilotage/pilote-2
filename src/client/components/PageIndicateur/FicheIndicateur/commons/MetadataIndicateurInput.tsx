import { UseFormRegisterReturn } from 'react-hook-form';
import { FunctionComponent } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import Input from '@/components/_commons/Input/Input';

export const MetadataIndicateurInput: FunctionComponent<{
  erreurMessage?: string,
  register: UseFormRegisterReturn<string>,
  htmlName: string,
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  valeurAffiché: string
  disabled?: boolean
}> = ({
  erreurMessage,
  register,
  htmlName,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
  disabled = false,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <Input
        disabled={disabled}
        erreurMessage={erreurMessage}
        htmlName={htmlName}
        register={register}
        type='text'
      />
    </MetadataIndicateurChamp>
  );
};
