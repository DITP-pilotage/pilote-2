import SélecteurMultipleProps from './SélecteurMultiple.interface';
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';

export default function SélecteurMultiple({ libellé, périmètresMinistériels }: SélecteurMultipleProps) {
  return (
    <div className="fr-form-group">
      <fieldset className="fr-fieldset">
        <legend
          className="fr-fieldset__legend fr-text--regular"
          id='checkboxes-legend'
        >
          { libellé }
        </legend>
        <div className="fr-fieldset__content">
          {périmètresMinistériels.map(périmètreMinistériel => (
            <div
              className="fr-checkbox-group"
              key={périmètreMinistériel.id}
            >
              <input
                id={`case-à-cocher-${périmètreMinistériel.id}`}
                name={`case-à-cocher-${périmètreMinistériel.id}`}
                type="checkbox"
              />
              <label
                className="fr-label"
                htmlFor={`case-à-cocher-${périmètreMinistériel.id}`}
              >
                {périmètreMinistériel.nom}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
