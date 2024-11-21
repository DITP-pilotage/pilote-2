import { FunctionComponent } from 'react';
import useSelectionIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm';
import SélecteurIndicateurActif
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SélecteurIndicateurActif/SélecteurIndicateurActif';
import {
  InformationDerniereModificationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';
import { formaterDate } from '@/client/utils/date/date';

interface SectionSelectionIndicateurProps {
  estEnCoursDeModification: boolean
  informationHistorisationIndicateur: InformationDerniereModificationMetadataIndicateurContrat
}

const SectionSelectionIndicateur: FunctionComponent<SectionSelectionIndicateurProps> = ({
  estEnCoursDeModification,
  informationHistorisationIndicateur,
}) => {
  const { setValue, getValues } = useSelectionIndicateurForm();

  return (
    <div className='flex w-full justify-between align-center'>
      <SélecteurIndicateurActif
        estEnCoursDeModification={estEnCoursDeModification}
        etatIndicateurSélectionné={getValues('indicHiddenPilote')}
        setEtatIndicateurSélectionné={setValue}
      />
      <div className='flex'>
        <p
          className='fr-badge fr-badge--error fr-badge--no-icon'
        >
          {`Dernière modification le ${formaterDate(informationHistorisationIndicateur.dateDerniereModification, 'DD/MM/YYYY')} par ${informationHistorisationIndicateur.auteurModification}`}
        </p>
      </div>
    </div>
  );
};

export default SectionSelectionIndicateur;
