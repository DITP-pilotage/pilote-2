import { FormEvent, useCallback, useState } from 'react';
import { récupérerUnCookie } from '@/client/utils/cookies';
import ChampsDeSaisieProps from './FormulaireDePublication.interface';
import CompteurCaractères from './CompteurCaractères/CompteurCaractères';
import FormulaireDePublicationStyled from './FormulaireDePublication.styled';

export default function FormulaireDePublication({ contenuInitial, limiteDeCaractères, àLaPublication, àLAnnulation }: ChampsDeSaisieProps) {
  const [contenu, setContenu] = useState(contenuInitial ?? '');

  const saisieContenuEstValide = useCallback(() => {
    return contenu.length > 0 && contenu.length <= limiteDeCaractères;
  }, [contenu.length, limiteDeCaractères]);

  const formulaireEstInvalide = useCallback(() => {
    return !saisieContenuEstValide();
  }, [saisieContenuEstValide]);

  const soumettreLeFormulaire = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formulaireEstInvalide()) {
      return;
    }

    àLaPublication(contenu, récupérerUnCookie('csrf') ?? '');
  };
  
  return (
    <FormulaireDePublicationStyled
      method="post"
      onSubmit={soumettreLeFormulaire}
    >
      <div className={`fr-mb-0 fr-input-group ${!saisieContenuEstValide() && 'fr-input-group--error'}`}>
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          onChange={(e) => {
            setContenu(e.target.value);
          }}
          rows={6}
          value={contenu}

        />
        {
          contenu.length > limiteDeCaractères &&
          <p className="fr-error-text">
            {`La limite maximale de ${limiteDeCaractères} caractères a été dépassée.`}
          </p>
        }
      </div>
      <CompteurCaractères
        compte={contenu.length}
        limiteDeCaractères={limiteDeCaractères}
      />
      <div className='actions fr-mt-1w'>
        <button
          className='fr-btn fr-mr-3w'
          disabled={!saisieContenuEstValide()}
          type='submit'
        >
          Publier
        </button>
        <button
          className='fr-btn fr-btn--secondary'
          onClick={àLAnnulation}
          type='button'
        >
          Annuler
        </button>
      </div>
    </FormulaireDePublicationStyled>
  );
}
