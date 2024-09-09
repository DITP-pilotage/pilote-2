import { UseFormRegisterReturn } from 'react-hook-form';
import { FunctionComponent } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import TextArea from '@/components/_commons/TextArea/TextArea';

export const MetadataIndicateurTextArea: FunctionComponent<{
  erreurMessage?: string,
  register: UseFormRegisterReturn<string>,
  htmlName: string,
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  valeurAffiché: string
}> = ({
  erreurMessage,
  register,
  htmlName,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
}) => {
  return (
    <MetadataIndicateurChamp
      estEnCoursDeModification={estEnCoursDeModification}
      informationMetadataIndicateur={informationMetadataIndicateur}
      valeurAffiché={valeurAffiché}
    >
      <TextArea
        erreurMessage={erreurMessage}
        htmlName={htmlName}
        register={register}
      />
    </MetadataIndicateurChamp>
  );
};
