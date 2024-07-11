import { FunctionComponent } from 'react';

interface ResponsableEnTete {
  libellé: string,
  listeNomsResponsables: (string)[],
}

const ResponsableChantierEnTete : FunctionComponent<ResponsableEnTete> = ({ libellé, listeNomsResponsables }) => {
  const nomResponsable = listeNomsResponsables.length > 0 ? listeNomsResponsables : 'Non renseigné';

  return (
    <div>
      <p className='fr-text--sm fr-mb-0 fr-text-title--blue-france'>
        <strong> 
          { libellé }
        </strong>
        {' '}
        :
        {' '}
        { nomResponsable }
      </p>         
    </div>
  );
};

export default ResponsableChantierEnTete;
