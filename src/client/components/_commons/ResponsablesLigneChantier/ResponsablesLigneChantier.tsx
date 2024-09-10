import { FunctionComponent } from 'react';
import Link from 'next/link';
import IcôneContacter from '@/client/components/_commons/IcôneContacter/IcôneContacter';
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
              className='fr-col-5 fr-col-md-4 fr-col-xl-2 flex align-start justify-end bouton-format-mobile'
            >  
              <div className='flex align-start'>
                <IcôneContacter className='fr-mr-1v fr-text-title--blue-france' />
                <Link
                  className='fr-link fr-link--sm'
                  href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}
                  title={`Contacter ${libelleEmailsResponsables}`}
                >  
                  Contacter
                </Link> 
              </div>                
            </div>
          ) : null
        } 
      </div>
    </ResponsablesLigneChantierStyled>
  );
};

export default ResponsablesLigneChantier;
