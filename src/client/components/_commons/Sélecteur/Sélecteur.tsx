import '@gouvfr/dsfr/dist/component/select/select.min.css';
import SélecteurProps from '@/components/_commons/Sélecteur/Sélecteur.interface';

export default function Sélecteur({
  htmlName,
  valeur,
  setValeur,
  options,
  libellé,
  texteFantôme = '',
}: SélecteurProps) {

  return (
    <div className="fr-select-group">
      {
        !!libellé && (
          <label
            className="fr-label"
            htmlFor={htmlName}
          >
            { libellé }
          </label>
        )
      }
      <select
        className="fr-select"
        name={htmlName}
        onChange={(événement) => {
          setValeur(événement.currentTarget.value);
        }}
        value={valeur || ''}
      >
        <option
          disabled
          hidden
          value=""
        >
          { texteFantôme }
        </option>
        {
          options.map(option => (
            <option
              key={option.valeur}
              value={option.valeur}
            >
              { option.libellé }
            </option>
          ))
        }
      </select>
    </div>
  );
}
