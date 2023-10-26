import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import InputAvecLabelProps from '@/components/_commons/InputAvecLabel/InputAvecLabel.interface';

export default function TextAreaAvecLabel({ erreur, libellé, htmlName, texteAide, register, disabled }: InputAvecLabelProps) {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      <label
        className="fr-label"
        htmlFor={htmlName}
      >
        {libellé}
        {
          !!texteAide &&
            <span className="fr-hint-text">
              {texteAide}
            </span>
        }
      </label>
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
