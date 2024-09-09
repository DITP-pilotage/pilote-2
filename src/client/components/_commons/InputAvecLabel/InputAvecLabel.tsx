import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { FunctionComponent, HTMLInputTypeAttribute } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

interface InputAvecLabelProps {
  type?: HTMLInputTypeAttribute,
  libellé: string,
  htmlName: string,
  texteAide?: string,
  erreur?:  FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  register: UseFormRegisterReturn
  disabled?: boolean
}

const InputAvecLabel: FunctionComponent<InputAvecLabelProps> = ({ type = 'text', erreur, libellé, htmlName, texteAide, register, disabled }) => {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      <label
        className='fr-label'
        htmlFor={htmlName}
      >
        {libellé}
        {
          !!texteAide &&
            <span className='fr-hint-text'>
              {texteAide}
            </span>
        }
      </label>
      <input
        className={`fr-input ${erreur !== undefined ? 'fr-input-group--error' : ''}`}
        disabled={disabled}
        id={htmlName}
        type={type}
        {...register}
      />
      {
        erreur !== undefined &&
          <p
            className='fr-error-text'
          >
            {erreur.message?.toString()}
          </p>
      }
    </div>
  );
};

export default InputAvecLabel; 
