
import '@gouvfr/dsfr/dist/component/segmented/segmented.css';
import ContrôleSegmentéProps from './ContrôleSegmenté.interface';
import ContrôleSegmentéStyled from './ContrôleSegmenté.styled';

export default function ContrôleSegmenté<T extends string>({ options, valeurSélectionnée, valeurModifiéeCallback } : ContrôleSegmentéProps<T>) {

  return (
    <ContrôleSegmentéStyled>
      <fieldset className='fr-segmented fr-segmented--sm'>
        <div className='fr-segmented__elements'>
          {
            options.map(option => ( 
              <div 
                className='fr-segmented__element' 
                key={`div-${option.valeur}`}
              >
                <input 
                  checked={option.valeur === valeurSélectionnée}
                  id={option.valeur}
                  key={option.valeur}
                  onClick={(event) => valeurModifiéeCallback(event.currentTarget.value as T)}
                  type='radio'
                  value={option.valeur}
                />
                <label 
                  className='fr-label fr-label-centered' 
                  htmlFor={option.valeur}
                >
                  {option.libellé}
                </label>
              </div>          
            ))
          }
        </div>
      </fieldset>
    </ContrôleSegmentéStyled>
  );
}
