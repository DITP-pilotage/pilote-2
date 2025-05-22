import { FunctionComponent } from 'react';
import Icône from '@/components/_commons/Icône/Icône';
import EnteteResponsablesStyled from './EnTêteResponsables.styled';

interface ResponsableEnTete {
  libellé?: string,
  listeNomsResponsables: string[],
  icone: string,
  iconeStyle?: 'icone' | 'span',
  size?: 'sm' | 'md'
}

const ResponsableChantierEnTete: FunctionComponent<ResponsableEnTete> = ({ libellé, listeNomsResponsables, icone, iconeStyle = 'span', size = 'md' }) => {
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
          <span className={`${icone} ${size === 'sm' ? 'fr-pl-1v fr-pr-1v' : ''}`} />
        )}
      </p>
      <div>
        <p className={`fr-mb-0 fr-text-title--blue-france ${size === 'sm' ? 'fr-text--xs' : ''}`}>
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
        <p className={`fr-mb-0 fr-text-title--blue-france ${size === 'sm' ? 'fr-text--xs' : ''}`}>
          {nomResponsable}
        </p>
      </div>
    </EnteteResponsablesStyled>
  );
};

export default ResponsableChantierEnTete;
