import { useState } from 'react';
import CompteurCaractères from '@/components/_commons/CompteurCaractères/CompteurCaractères';
import ChampsDeSaisieProps from './ChampsDeSaisie.interface';

export default function ChampsDeSaisie({ libellé, contenu, setContenu, limiteDeCaractères }: ChampsDeSaisieProps) {
  const [compte, setCompte] = useState(contenu?.length ?? 0);

  return (
    <>
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
    </>
  );
}
