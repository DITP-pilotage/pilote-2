import { Fragment } from 'react';
import ResponsablesLigneProps from './ResponsablesLigne.interface';

export default function ResponsablesLigne({ libellé, contenu }: ResponsablesLigneProps) {
  return (
    <div className='ligne fr-grid-row fr-pb-2w'>
      <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w fr-m-0'>
        {libellé}
      </p>
      <p className='fr-text--sm fr-col fr-m-0'>
        { 
          contenu.length > 0 
            ? contenu.map((élément, i) => {
              return (
                <Fragment key={`responsable-${élément}`}>
                  {
                    i === contenu.length - 1
                      ? élément
                      : élément + ', '
                  }
                </Fragment>
              );
            })
            : 'Non Renseigné' 
          }
      </p>
    </div>
  );
}
