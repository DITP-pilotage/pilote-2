import ResponsablesLigneProps from './ResponsablesLigne.interface';

export default function ResponsablesLigne({ libellé, estEnTeteDePageChantier, estNomResponsable, estEmailResponsable  }: ResponsablesLigneProps) {
  const emailResponsable = estEmailResponsable && estEmailResponsable.length > 0 ? estEmailResponsable : null;
  const nomResponsable = estNomResponsable.length > 0 ? estNomResponsable : 'Non renseigné';
  return (
    <div>
      { 
        estEnTeteDePageChantier ? 
          (
            <p className='fr-text--sm fr-mb-0 fr-text-title--blue-france'>
              <strong> 
                { libellé }            
              </strong>
              {' '}
              :
              {' '}
              { nomResponsable }    
            </p>           
          ) : (       
            <div className='ligne fr-grid-row fr-grid-row--gutters fr-pb-2w'>
              <div className='fr-text--sm fr-text--bold fr-col-4 fr-m-0 fr-pb-1v fr-py-md-1w'>
                { libellé }
              </div>
              <p className='fr-text--sm fr-col-4 fr-m-0 fr-pb-1v fr-p-md-1w'>
                { nomResponsable }             
              </p>
              <div
                className='fr-col-4'
                hidden={!emailResponsable}
              >
                <button
                  className='fr-btn'
                  title={`Contacter ${ emailResponsable }`}
                  type='button'
                >
                  <a href={`mailto:${ emailResponsable }`}>
                    Contacter
                  </a>
                </button>
              </div>
            </div>
          )
      }   
    </div>
  );
}
