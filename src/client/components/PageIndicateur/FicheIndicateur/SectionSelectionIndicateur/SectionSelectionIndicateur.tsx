import { FunctionComponent } from 'react';
import useSelectionIndicateurForm
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm';
import SélecteurIndicateurActif
  from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/SélecteurIndicateurActif/SélecteurIndicateurActif';
import {
  InformationDerniereModificationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';

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
          {`Dernière modification le ${informationHistorisationIndicateur.dateDerniereModification} par ${informationHistorisationIndicateur.auteurModification}`}
        </p>
      </div>
    </div>
  );
};

export default SectionSelectionIndicateur;
