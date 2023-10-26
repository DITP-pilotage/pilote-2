import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { PropsWithChildren } from 'react';
import TextAreaProps from '@/components/_commons/TextArea/TextArea.interface';

export default function TextArea({ children, erreur, htmlName, register, disabled }: PropsWithChildren<TextAreaProps>) {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      {children}
      <textarea
        className={`fr-input ${erreur !== undefined ? 'fr-input-group--error' : ''}`}
        disabled={disabled}
        id={htmlName}
        {...register}
      />
      {
        erreur !== undefined &&
          <p
            className="fr-error-text"
          >
            {erreur.message?.toString()}
          </p>
      }
    </div>
  );
}
