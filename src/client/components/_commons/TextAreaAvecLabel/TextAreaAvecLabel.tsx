import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { FunctionComponent, HTMLInputTypeAttribute } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

interface TexteAreaLabelProps {
  libellé: string,
  htmlName: string,
  register: UseFormRegisterReturn,
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>,
  erreurMessage?: string,
  disabled?: boolean,
  className?: string,
  texteAide?: string,
  type?: HTMLInputTypeAttribute
}

const TextAreaAvecLabel: FunctionComponent<TexteAreaLabelProps> = ({
  erreur,
  erreurMessage,
  libellé,
  htmlName,
  texteAide,
  register,
  disabled,
  className,
}) => {
  return (
    <div className={`fr-input-group ${erreur !== undefined || erreurMessage ? 'fr-input-group--error' : ''}`}>
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
      <textarea
        className={`fr-input${erreur !== undefined || erreurMessage ? ' fr-input-group--error' : ''}${className !== undefined ? ' ' + className : ''}`}
        disabled={disabled}
        id={htmlName}
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

export default TextAreaAvecLabel;
