import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import { FunctionComponent, useId } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface CaseACocherProps {
  libellé: string,
  register: UseFormRegisterReturn
}

const CaseACocher: FunctionComponent<CaseACocherProps> = ({ libellé, register }) => {
  const id = useId();

  return (
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
  );
};

export default CaseACocher;
