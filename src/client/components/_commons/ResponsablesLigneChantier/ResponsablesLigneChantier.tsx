import { FunctionComponent, useEffect, useState } from 'react';
import ResponsablesLigneChantierStyled from './ResponsablesLigneChantier.styled';

interface ResponsablesLigneProps {
  libellé: string,
  libelleNomsResponsables: string,
  libelleEmailsResponsables: string,
  libelléChantier: string,
}

const ResponsablesLigneChantier: FunctionComponent<ResponsablesLigneProps> = ({
  libellé,
  libelleNomsResponsables,
  libelleEmailsResponsables,
  libelléChantier,
}) => {
  const [boutonContacterFormatDesktop, setBoutonContacterFormatDesktop] = useState(true);
  const objetCourriel = encodeURIComponent(`PILOTE - PPG - ${libelléChantier}`);

  useEffect(() => {
    const gererTailleEcran = () => {
      if (window.innerWidth < 768) {
        setBoutonContacterFormatDesktop(false);
      } else {
        setBoutonContacterFormatDesktop(true);
      }
    };

    window.addEventListener('resize', gererTailleEcran);
    return () => window.removeEventListener('reset', gererTailleEcran);
  }, []);

  return (
    <ResponsablesLigneChantierStyled>
      <div className='fr-grid-row fr-grid-row--gutters fr-pb-2w'>
        <div className='fr-text--sm fr-text--bold fr-col-4 fr-m-0 fr-pb-1v fr-py-md-1w'>
          {libellé}
        </div>
        <p className='fr-text--sm fr-col-4 fr-m-0 fr-pb-1v fr-p-md-1w'>
          {libelleNomsResponsables || 'Non renseigné'}
        </p>
        {
          libelleEmailsResponsables ? (
            <div
              className='fr-col-4 centrer-bouton'
            >
              {
                boutonContacterFormatDesktop ? (
                  <button
                    className='fr-btn'
                    title={`Contacter ${libelleEmailsResponsables}`}
                    type='button'
                  >
                    <a href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}>
                      <span
                        aria-hidden='true'
                        className='fr-icon-mail-fill'
                      />
                      {' '}
                      Contacter
                    </a>
                  </button>
                ) : (
                  <button
                    className='fr-btn'
                    title={`Contacter ${libelleEmailsResponsables}`}
                    type='button'
                  >
                    <a href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}>
                      <span
                        aria-hidden='true'
                        className='fr-icon-mail-fill'
                      /> 
                    </a>
                  </button>
                )
              }
            </div>
          ) : null
        } 
      </div>
    </ResponsablesLigneChantierStyled>
  );
};

export default ResponsablesLigneChantier;
