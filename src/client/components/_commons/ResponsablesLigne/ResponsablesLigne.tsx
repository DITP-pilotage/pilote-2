import { Fragment } from 'react';
import ResponsablesLigneProps from './ResponsablesLigne.interface';

export default function ResponsablesLigne({ libellé, contenu, estEnTeteDePageChantier }: ResponsablesLigneProps) {
  const informationComplémentaireResponsable = contenu.length > 0 ? contenu.map((élément, i) => {
    return (
    // eslint-disable-next-line react/no-array-index-key
      <Fragment key={`responsable-${élément}-${i}`}>
        {élément}
        {contenu.length - 1 !== i ? ', ' : null}
      </Fragment>
    );
  }) : 'Non Renseigné';
  
  return (
    <div>
      { estEnTeteDePageChantier ? 
        (
          <p className='sectionEnTeteReponsablesChantiers fr-text--sm fr-mb-0'>
            <strong> 
              { libellé }            
            </strong>
            {' '}
            :
            {' '}
            { informationComplémentaireResponsable }
          </p>           
        ) : 
        (
         
          <div className='ligne fr-grid-row fr-grid-row--gutters fr-pb-2w'>
            <div className='fr-text--sm fr-text--bold fr-col-12 fr-col-md-6 fr-m-0 fr-pb-1v fr-py-md-1w'>
              { libellé }
            </div>
            <div className='fr-text--sm fr-col-12 fr-col-md-6 fr-m-0 fr-pt-0 fr-p-md-1w'>
              { informationComplémentaireResponsable }
            </div>
          </div>
          
        )}   
    </div>
  );
}
