import { Fragment } from 'react';
import ResponsablesLigneProps from './ResponsablesLigne.interface';

export default function ResponsablesLigne({ libellé, contenu }: ResponsablesLigneProps) {
  return (
    <div className='fr-pl-2w fr-grid-row'>
      <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w'>
        {libellé}
      </p>
      <p className='fr-text--sm fr-col'>
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
