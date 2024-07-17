import { FunctionComponent } from 'react';
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
  const objetCourriel = encodeURIComponent(`PILOTE - PPG - ${libelléChantier}`);

  return (
    <ResponsablesLigneChantierStyled>
      <div className='fr-grid-row fr-grid-row--gutters fr-pb-2w'>
        <div className='fr-text--sm fr-text--bold fr-col-8 fr-col-md-4 fr-col-xl-5 fr-m-0 fr-pb-1v fr-py-md-1w'>
          {libellé}
        </div>
        <p className='fr-text--sm fr-col-7 fr-col-md-4 fr-col-xl-5 fr-m-0 fr-pb-1v fr-p-md-1w'>
          {libelleNomsResponsables || 'Non renseigné'}
        </p>
        {
          libelleEmailsResponsables ? (
            <div
              className='fr-col-5 fr-col-md-4 fr-col-xl-2 flex align-start justify-end boutonContacterFormatMobile'
            >  
              <div>
                <span
                  aria-hidden='true'
                  className='fr-icon-mail-line fr-text-title--blue-france fr-mr-1w'
                />
                <a
                  className='fr-link fr-link--sm'
                  href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}
                  title={`Contacter ${libelleEmailsResponsables}`}
                >  
                  Contacter
                </a>
              </div>                
            </div>
          ) : null
        } 
      </div>
    </ResponsablesLigneChantierStyled>
  );
};

export default ResponsablesLigneChantier;
