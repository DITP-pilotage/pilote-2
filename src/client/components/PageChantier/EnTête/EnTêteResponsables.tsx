import { FunctionComponent } from 'react';
import Icône from '@/components/_commons/Icône/Icône';
interface ResponsableEnTete {
  libellé?: string,
  listeNomsResponsables: string[],
  icone: string,
  iconeStyle?: 'icone' | 'span'
}

const ResponsableChantierEnTete: FunctionComponent<ResponsableEnTete> = ({ libellé, listeNomsResponsables, icone, iconeStyle = 'span' }) => {
  const nomResponsable = listeNomsResponsables.join(', ') || 'Non renseigné';

  return (
    <div className='flex'>
      <p className='fr-text--lg fr-text-title--blue-france fr-mb-1w fr-pr-1w'>
        {iconeStyle === 'icone' ? <Icône id={icone} /> : <span className={icone} />}
      </p>
      <div>
        <p className='fr-text--sm fr-mb-0 fr-text-title--blue-france'>
          {
            libellé ? (
              <>
                <strong>
                  {libellé}
                </strong>
                {' '}
                : 
              </>
            ) : null 
          }
        </p>
        <p className='fr-text--sm fr-mb-0 fr-text-title--blue-france'>
          {nomResponsable}
        </p>
      </div>
    </div>
  );
};

export default ResponsableChantierEnTete;
