import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import { Fragment, FunctionComponent, useId } from 'react';
import { MultiSelectOptionGroupée } from '@/components/_commons/MultiSelect/MultiSelect.interface';

interface MultiSelectGroupeProps {
  groupeOptions: MultiSelectOptionGroupée
  changementÉtatCallback: (valeur: string) => void
  valeursSélectionnées: Set<string>
}

const MultiSelectGroupe: FunctionComponent<MultiSelectGroupeProps> = ({ groupeOptions, changementÉtatCallback, valeursSélectionnées }) => {
  const id = useId();

  if (groupeOptions.options.length === 0) 
    return null;
    
  return (
    <>
      <p className='groupe-label fr-mb-1w fr-mt-2w'>
        {groupeOptions.label.toUpperCase()}
      </p>
      {
        groupeOptions.options.map(option => (
          <Fragment key={`${option.value} ${id}`}>
            <div className='fr-fieldset__element'>
              <div className='fr-checkbox-group'>
                <input
                  checked={valeursSélectionnées.has(option.value)}
                  className='fr-input'
                  disabled={option.disabled}
                  id={`${option.value} ${id}`}
                  name={option.value}
                  onChange={() => changementÉtatCallback(option.value)}
                  type='checkbox'
                />
                <label
                  className='fr-label'
                  htmlFor={`${option.value} ${id}`}
                >
                  {option.label}
                  {
                    !!option.afficherIcone && 
                    <span 
                      aria-hidden='true'
                      className='fr-icon-close-circle-fill fr-icon--sm fr-icon-red fr-ml-1w' 
                    />
                  }
                </label>
                
              </div>
            </div>
          </Fragment>
        ))
      }
    </>
  );
};

export default MultiSelectGroupe;
