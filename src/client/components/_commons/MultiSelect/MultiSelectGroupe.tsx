import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import { Fragment, useId } from 'react';
import MultiSelectGroupeProps from '@/components/_commons/MultiSelect/MultiSelectGroupe.interface';

export default function MultiSelectGroupe({ groupeOptions, changementÉtatCallback, valeursSélectionnées } : MultiSelectGroupeProps) {
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
            <div className="fr-fieldset__element">
              <div className="fr-checkbox-group">
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
                </label>
              </div>
            </div>
          </Fragment>
        ))
      }
    </>
  );
}
