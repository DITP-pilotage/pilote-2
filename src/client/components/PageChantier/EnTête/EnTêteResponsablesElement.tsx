import { FunctionComponent } from 'react';
import Icône from '@/components/_commons/Icône/Icône';
import EnteteResponsablesStyled from './EnTêteResponsables.styled';

interface ResponsableEnTeteElement {
  libellé?: string,
  listeNomsResponsables: React.ReactNode[],
  icone: string,
  iconeStyle?: 'icone' | 'span',
  size?: 'sm' | 'md',
  isUppercase?: boolean
}

export const ResponsableChantierEnTeteElement: FunctionComponent<ResponsableEnTeteElement> = ({ libellé, listeNomsResponsables, icone, iconeStyle = 'span', size = 'md', isUppercase = false }) => {
  return (
    <EnteteResponsablesStyled className='flex'>
      <div className='icone-entete fr-text-title--blue-france fr-mb-1w fr-pr-1w'>
        {iconeStyle === 'icone' ? (
          <Icône
            className='icone-entete'
            id={icone}
          />
        ) : (
          <span className={`${icone} ${size === 'sm' ? 'fr-pl-1v fr-pr-1v' : ''}`} />
        )}
      </div>
      <div className='fr-pl-1v fr-mt-1v'>
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
        <ul className={`fr-mb-0 fr-text-title--blue-france ${size === 'sm' ? 'fr-text--xs' : ''}${isUppercase ? ' uppercase' : ''}`}>
          {listeNomsResponsables.map((nomResponsable, index) => (
            <li key={index}>
              {nomResponsable}
            </li>
          ))}
        </ul>
      </div>
    </EnteteResponsablesStyled>
  );
};
