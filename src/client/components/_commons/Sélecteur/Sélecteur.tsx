import '@gouvfr/dsfr/dist/component/select/select.min.css';
import SélecteurProps from '@/components/_commons/Sélecteur/Sélecteur.interface';

const Sélecteur = <T extends string>({
  htmlName,
  register,
  options,
  libellé,
  erreur,
  errorMessage,
  texteFantôme,
  texteAide,
  valeurModifiéeCallback,
  valeurSélectionnée,
  estDesactive,
}: SélecteurProps<T>) => {
  return (
    <div className={`fr-select-group${erreur !== undefined || errorMessage ? ' fr-select-group--error' : ''} ${estDesactive ? 'fr-select-group--disabled' : ''}`}>
      {
        !!libellé && (
          <label
            className='fr-label'
            htmlFor={htmlName}
          >
            {libellé}
          </label>
        )
      }
      {
        !!texteAide &&
        <span className='fr-hint-text'>
          {texteAide}
        </span>
      }
      <select
        aria-label={libellé}
        className={`fr-select fr-mt-1w${erreur !== undefined || errorMessage ? ' fr-select--error' : ''}`}
        disabled={estDesactive}
        name={htmlName}
        onChange={(événement) => valeurModifiéeCallback && valeurModifiéeCallback(événement.currentTarget.value as T)}
        value={valeurSélectionnée || ''}
        {...register}
      >
        {
          !!texteFantôme &&
          <option
            disabled
            hidden
            value=''
          >
            {texteFantôme}
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
              {option.libellé}
            </option>
          ))
        }
      </select>
      {
        (errorMessage !== undefined || erreur !== undefined) &&
        <p
          className='fr-error-text'
        >
          {errorMessage || erreur?.message?.toString()}
        </p>
      }
    </div>
  );
};

export default Sélecteur;
