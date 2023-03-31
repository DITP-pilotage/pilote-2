import { FormEvent, useEffect, useId, useState } from 'react';
import { récupérerUnCookie } from '@/client/utils/cookies';
import ChampsDeSaisieProps from './FormulaireDePublication.interface';
import CompteurCaractères from './CompteurCaractères/CompteurCaractères';
import FormulaireDePublicationStyled from './FormulaireDePublication.styled';

export default function FormulaireDePublication({ libellé, contenuParDéfaut, limiteDeCaractères, àLaSoumissionDuFormulaire, àLAnnulation }: ChampsDeSaisieProps) {
  const uniqueId = useId();
  const [contenu, setContenu] = useState(contenuParDéfaut ?? '');
  const [nombreDeCaractères, setNombreDeCaractères] = useState(contenu?.length ?? 0);
  const [aDépasséLaLimiteDeCaractères, setADépasséLaLimiteDeCaractères] = useState(false);

  const soumettreLeFormulaire = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (nombreDeCaractères === 0) {
      return;
    }

    if (aDépasséLaLimiteDeCaractères) {
      return;
    }

    àLaSoumissionDuFormulaire(contenu, récupérerUnCookie('csrf') ?? '');
  };

  useEffect(() => {
    if (nombreDeCaractères > limiteDeCaractères) 
      setADépasséLaLimiteDeCaractères(true);
    else
      setADépasséLaLimiteDeCaractères(false);
  }, [nombreDeCaractères, limiteDeCaractères]);
  
  return (
    <FormulaireDePublicationStyled
      method="post"
      onSubmit={soumettreLeFormulaire}
    >
      <div className={`fr-mb-0 fr-input-group ${aDépasséLaLimiteDeCaractères && 'fr-input-group--error'}`}>
        <label
          className="fr-label fr-sr-only"
          htmlFor={`contenu-${uniqueId}`}
        >
          {libellé}
        </label>
        <textarea
          className={`fr-input fr-text--sm fr-mb-0 ${aDépasséLaLimiteDeCaractères && 'fr-input--error'}`}
          id={`contenu-${uniqueId}`}
          name={`contenu-${uniqueId}`}
          onChange={(e) => {
            setContenu(e.target.value);
            setNombreDeCaractères(e.target.value.length);
          }}
          rows={6}
          value={contenu}
        />
        {
          !!aDépasséLaLimiteDeCaractères &&
          <p
            className="fr-error-text"
            id={`error-${uniqueId}`}
          >
            La limite maximale de 
            {' '}
            {limiteDeCaractères}
            {' '}
            caractères a été dépassée
          </p>
        }
      </div>
      <CompteurCaractères
        compte={nombreDeCaractères}
        limiteDeCaractères={limiteDeCaractères}
      />
      <div className='actions'>
        <button
          className='fr-btn fr-mr-3w border-radius-4px'
          disabled={aDépasséLaLimiteDeCaractères || nombreDeCaractères === 0}
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
    </FormulaireDePublicationStyled>
  );
}
