import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import { useId, useState } from 'react';
import CaseACocherProps from './CaseACocher.interface';

export default function CaseACocher({ libellé, register } : CaseACocherProps) {
  const id = useId();

  return (
    <>
      <div className='fr-fieldset__element'>
        <div className='fr-checkbox-group'>
          <input
            className='fr-input'
            id={id}
            type='checkbox'
            {...register}
          />
          <label
            className='fr-label'
            htmlFor={id}
          >
            {libellé}
          </label>
        </div>
      </div>
    </>
  );
}
