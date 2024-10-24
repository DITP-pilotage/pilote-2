import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { FunctionComponent, PropsWithChildren } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

const TextArea: FunctionComponent<PropsWithChildren<{
  htmlName: string,
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  erreurMessage?: string
  register: UseFormRegisterReturn
  disabled?: boolean,
  className?: string
}>> = ({
  children,
  erreur,
  erreurMessage,
  htmlName,
  register,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`fr-input-group ${erreur !== undefined || erreurMessage ? 'fr-input-group--error' : ''}`}>
      {children}
      <textarea
        className={`fr-input${erreur !== undefined || erreurMessage ? ' fr-input-group--error' : ''}${className !== undefined ? ' ' + className : ''}`}
        disabled={disabled}
        id={htmlName}
        {...register}
      />
      {
        (erreurMessage !== undefined || erreur !== undefined) &&
        <p
          className='fr-error-text fr-mt-1v'
        >
          {erreurMessage?.toString()}
        </p>
      }
    </div>
  );
};

export default TextArea;
