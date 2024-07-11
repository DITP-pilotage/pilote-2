import { FunctionComponent } from 'react';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface ResponsablesLigneProps {
  libellé: string,
  listeNomsResponsables: (string)[],
  listeEmailsResponsables?: (string)[]
  libelléChantier?: Chantier['nom'],
}

const ResponsablesLigne : FunctionComponent<ResponsablesLigneProps> = ({ libellé,  listeNomsResponsables, listeEmailsResponsables, libelléChantier }) => {
  const emailResponsable =  (listeEmailsResponsables || []).length > 0 ? listeEmailsResponsables : null;
  const nomResponsable = listeNomsResponsables.length > 0 ? listeNomsResponsables : 'Non renseigné';

  const objetCourriel = encodeURIComponent(`PILOTE - PPG - ${libelléChantier}`);
  const contenuCourriel = encodeURIComponent(`${libelléChantier}`);
  
  return (  
    <div className='ligne fr-grid-row fr-grid-row--gutters fr-pb-2w'>
      <div className='fr-text--sm fr-text--bold fr-col-4 fr-m-0 fr-pb-1v fr-py-md-1w'>
        { libellé }
      </div>
      <p className='fr-text--sm fr-col-4 fr-m-0 fr-pb-1v fr-p-md-1w'>
        { nomResponsable }             
      </p>
      <div
        className='fr-col-4'
        hidden={!emailResponsable}
      >
        <button
          className='fr-btn'
          title={`Contacter ${ emailResponsable }`}
          type='button'
        >
          <a href={`mailto:${ emailResponsable }?subject=${objetCourriel}&body=${contenuCourriel}`}>
            Contacter
          </a>
        </button>
      </div>
    </div> 
  );
};

export default ResponsablesLigne;
