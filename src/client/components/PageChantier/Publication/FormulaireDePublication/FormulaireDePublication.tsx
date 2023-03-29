import { useState } from 'react';
import ChampsDeSaisieProps from './FormulaireDePublication.interface.';
import CompteurCaractères from './CompteurCaractères/CompteurCaractères';

export default function FormulaireDePublication({ libellé, contenu, setContenu, limiteDeCaractères, onSubmit, csrf, àLAnnulation }: ChampsDeSaisieProps) {
  const [compte, setCompte] = useState(contenu?.length ?? 0);
  
  return (
    <form
      method="post"
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        id="csrf"
        name="csrf token"
        type="hidden"
        value={csrf}
      />
      <div className={`fr-mb-0 fr-input-group ${compte === limiteDeCaractères && 'fr-input-group--error'}`}>
        <label
          className="fr-label fr-sr-only"
          htmlFor="saisie-contenu-commentaire"
        >
          {libellé}
        </label>
        <textarea
          className={`fr-input fr-text--sm fr-mb-0 ${compte === limiteDeCaractères && 'fr-input--error'}`}
          id="saisie-contenu-commentaire"
          maxLength={limiteDeCaractères}
          name="saisie-contenu-commentaire"
          onChange={(e) => {
            setContenu(e.target.value);
            setCompte(e.target.value.length);
          }}
          rows={6}
          value={contenu}
        />
        {
          compte === limiteDeCaractères &&
          <p
            className="fr-error-text"
            id="text-input-error-desc-error"
          >
            Limite de caractères atteinte
          </p>
        }
      </div>
      <CompteurCaractères
        compte={compte}
        limiteDeCaractères={limiteDeCaractères}
      />
      <div className='actions'>
        <button
          className='fr-btn fr-mr-3w border-radius-4px'
          type='submit'
        >
          Publier
        </button>
        <button
          className='fr-btn fr-btn--secondary border-radius-4px'
          onClick={àLAnnulation}
          type='button'
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
