import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import InputAvecLabelProps from '@/components/_commons/InputAvecLabel/InputAvecLabel.interface';

export default function InputAvecLabel({ type = 'text', erreur, libellé, htmlName, texteAide, register }: InputAvecLabelProps) {
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
      <input
        className={`fr-input ${erreur !== undefined ? 'fr-input-group--error' : ''}`}
        id={htmlName}
        type={type}
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
