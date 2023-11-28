import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { PropsWithChildren } from 'react';
import InputProps from '@/components/_commons/Input/Input.interface';

export default function Input({ children, type = 'text', erreur, htmlName, register, disabled }: PropsWithChildren<InputProps>) {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      {children}
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
}
