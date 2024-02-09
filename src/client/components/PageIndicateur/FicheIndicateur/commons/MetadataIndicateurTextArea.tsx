import { UseFormRegisterReturn } from 'react-hook-form';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataIndicateurChamp } from '@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp';
import TextArea from '@/components/_commons/TextArea/TextArea';

export const MetadataIndicateurTextArea = ({
  erreurMessage,
  register,
  htmlName,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
}: {
  erreurMessage?: string,
  register: UseFormRegisterReturn<string>,
  htmlName: string,
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  valeurAffiché: string
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
