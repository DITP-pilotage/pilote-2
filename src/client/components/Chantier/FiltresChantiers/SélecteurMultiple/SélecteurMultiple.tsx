import SélecteurMultipleProps from './SélecteurMultiple.interface';
import '@gouvfr/dsfr/dist/component/select/select.min.css';

export default function SélecteurMultiple({ libellé }: SélecteurMultipleProps) {
  return (
    <div className="fr-select-group fr-pb-2w">
      <label className="fr-label">
        { libellé }
      </label>
      <select
        className="fr-select"
        style={{ backgroundColor: '#fff' }}
      >
        <option hidden>
          0 sélectionné
        </option>
        <option>
          1 sélectionné
        </option>
        <option>
          2 sélectionnés
        </option>
      </select>
    </div>
  );
}