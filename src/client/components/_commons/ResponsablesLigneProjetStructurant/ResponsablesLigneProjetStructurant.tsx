import { FunctionComponent } from 'react';

interface ResponsablesLigneProps {
  libellé: string,
  listeNomsResponsables: string[],
}

const ResponsablesLigneProjetStructurant: FunctionComponent<ResponsablesLigneProps> = ({
  libellé,
  listeNomsResponsables,
}) => {
  const nomResponsable = listeNomsResponsables.length > 0 ? listeNomsResponsables : 'Non renseigné';

  return (
    <div className='ligne fr-grid-row fr-grid-row--gutters fr-pb-2w'>
      <div className='fr-text--sm fr-text--bold fr-col-4 fr-m-0 fr-pb-1v fr-py-md-1w'>
        {libellé}
      </div>
      <p className='fr-text--sm fr-col-4 fr-m-0 fr-pb-1v fr-p-md-1w'>
        {nomResponsable}
      </p>
    </div>
  );
};

export default ResponsablesLigneProjetStructurant;
