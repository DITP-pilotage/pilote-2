import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import InputAvecLabelProps from '@/components/_commons/ReactHookForm/InputAvecLabel.interface';


export default function InputAvecLabel({ type = 'text', erreur, libellé, name, texteAide, register }: InputAvecLabelProps) {
  return (
    <div className={`fr-input-group ${erreur !== undefined ? 'fr-input-group--error' : ''}`}>
      <label
        className="fr-label"
        htmlFor="text-input-text"
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
        type={type}
        {...register(name)}
      />
      {
        erreur !== undefined &&
          <p
            className="fr-error-text"
          >
            {erreur.message}
          </p>
      }
    </div>
  );
}
