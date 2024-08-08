import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { FunctionComponent, HTMLInputTypeAttribute, PropsWithChildren } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

interface InputProps {
  type?: HTMLInputTypeAttribute,
  htmlName: string,
  texteAide?: string,
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  erreurMessage?: string,
  register: UseFormRegisterReturn
  disabled?: boolean
  className?: string
}

const Input: FunctionComponent<PropsWithChildren<InputProps>> = ({
  children,
  type = 'text',
  erreur,
  erreurMessage,
  htmlName,
  register,
  disabled,
  className,
}) => {
  return (
    <div className={`fr-input-group ${erreur !== undefined || erreurMessage ? 'fr-input-group--error' : ''}`}>
      {children}
      <input
        className={`fr-input${erreur !== undefined || erreurMessage ? ' fr-input-group--error' : ''}${className !== undefined ? ' ' + className : ''}`}
        disabled={disabled}
        id={htmlName}
        type={type}
        {...register}
      />
      {
        (erreurMessage !== undefined || erreur !== undefined) &&
        <p
          className='fr-error-text fr-mt-1v'
        >
          {erreurMessage}
        </p>
      }
    </div>
  );
};

export default Input;
