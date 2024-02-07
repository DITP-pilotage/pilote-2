import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { PropsWithChildren } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

export default function TextArea({ children, erreur, htmlName, register, disabled = false, className = '' }: PropsWithChildren<{
  libellé: string,
  htmlName: string,
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  register: UseFormRegisterReturn
  disabled?: boolean,
  className?: string
}>) {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      {children}
      <textarea
        className={`fr-input ${erreur !== undefined ? 'fr-input-group--error' : ''} ${className !== undefined ? className : ''}`}
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
}
