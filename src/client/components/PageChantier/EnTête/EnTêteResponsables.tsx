import { FunctionComponent } from 'react';
import Icône from '@/components/_commons/Icône/Icône';
import EnteteResponsablesStyled from './EnTêteResponsables.styled';

interface ResponsableEnTete {
  libellé?: string,
  listeNomsResponsables: string[],
  icone: string,
  iconeStyle?: 'icone' | 'span'
}

const ResponsableChantierEnTete: FunctionComponent<ResponsableEnTete> = ({ libellé, listeNomsResponsables, icone, iconeStyle = 'span' }) => {
  const nomResponsable = listeNomsResponsables.join(', ') || 'Non renseigné';

  return (
    <EnteteResponsablesStyled className='flex'>
      <p className='icone-entete fr-text-title--blue-france fr-mb-1w fr-pr-1w'>
        {iconeStyle === 'icone' ? (
          <Icône
            className='icone-entete'
            id={icone}
          />
        ) : (
          <span className={icone} />
        )}
      </p>
      <div>
        <p className='fr-mb-0 fr-text-title--blue-france'>
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
    </EnteteResponsablesStyled>
  );
};

export default ResponsableChantierEnTete;
