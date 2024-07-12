import { FunctionComponent } from 'react';

interface ResponsablesLigneProps {
  libellé: string,
  libelleNomsResponsables: string,
  listeEmailsResponsables: string[],
  libelléChantier: string,
}

const ResponsablesLigneChantier: FunctionComponent<ResponsablesLigneProps> = ({
  libellé,
  libelleNomsResponsables,
  listeEmailsResponsables,
  libelléChantier,
}) => {
  const objetCourriel = encodeURIComponent(`PILOTE - PPG - ${libelléChantier}`);
  const contenuCourriel = encodeURIComponent(`${libelléChantier}`);

  return (
    <div className='ligne fr-grid-row fr-grid-row--gutters fr-pb-2w'>
      <div className='fr-text--sm fr-text--bold fr-col-4 fr-m-0 fr-pb-1v fr-py-md-1w'>
        {libellé}
      </div>
      <p className='fr-text--sm fr-col-4 fr-m-0 fr-pb-1v fr-p-md-1w'>
        {libelleNomsResponsables || 'Non renseigné'}
      </p>
      {
        listeEmailsResponsables.length > 0 ? (
          <div
            className='fr-col-4'
          >
            <button
              className='fr-btn'
              title={`Contacter ${listeEmailsResponsables}`}
              type='button'
            >
              <a href={`mailto:${listeEmailsResponsables}?subject=${objetCourriel}&body=${contenuCourriel}`}>
                Contacter
              </a>
            </button>
          </div>
        ) : null
      }
    </div>
  );
};

export default ResponsablesLigneChantier;
