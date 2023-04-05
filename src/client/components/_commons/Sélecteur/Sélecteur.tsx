import '@gouvfr/dsfr/dist/component/select/select.min.css';
import SélecteurProps from '@/components/_commons/Sélecteur/Sélecteur.interface';

export default function Sélecteur<T extends string>({
  htmlName,
  valeurSélectionnée,
  setValeurSélectionnée,
  options,
  libellé,
  texteFantôme,
}: SélecteurProps<T>) {

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
        onChange={(événement) => setValeurSélectionnée(événement.currentTarget.value as T)}
        value={valeurSélectionnée || ''}
      >
        {
          !!texteFantôme &&
          <option
            disabled
            hidden
            value=''
          >
            { texteFantôme }
          </option>
        }
        {
          options.map(option => (
            <option
              disabled={option.désactivée ?? false}
              hidden={option.cachée ?? false}
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
