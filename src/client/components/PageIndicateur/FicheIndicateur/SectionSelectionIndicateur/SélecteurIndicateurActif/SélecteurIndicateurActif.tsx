import { FunctionComponent } from 'react';
import SélecteurRéformeProps from './SélecteurIndicateurActif.interface';
import SélecteurRéformeStyled from './SélecteurIndicateurActif.styled';

export type EtatIndicateur = 'true' | 'false';

const SélecteurIndicateurActif: FunctionComponent<SélecteurRéformeProps> = ({ setEtatIndicateurSélectionné, etatIndicateurSélectionné, estEnCoursDeModification }) => {
  const etatIndicateurÀAfficher: { label: string, valeur: EtatIndicateur, className: string }[] = [
    {
      label: 'Actif',
      valeur: 'true',
      className: 'actif',
    },
    {
      label: 'Inactif',
      valeur: 'false',
      className: 'inactif',
    },
  ];
      
  return (
    <SélecteurRéformeStyled className='fr-p-1v'>
      {
          etatIndicateurÀAfficher.map(etatIndicateur => (
            <button
              className={`${etatIndicateurSélectionné === etatIndicateur.valeur && 'sélectionné fr-text--bold'} ${etatIndicateur.className}`}
              disabled={!estEnCoursDeModification}
              key={etatIndicateur.valeur}
              onClick={() => setEtatIndicateurSélectionné('indicHiddenPilote', etatIndicateur.valeur)}
              type='button'
            >
              {etatIndicateur.label}  
              {' '}
              { estEnCoursDeModification }
            </button>
          ))
        }
    </SélecteurRéformeStyled>
  );
};

export default SélecteurIndicateurActif;
