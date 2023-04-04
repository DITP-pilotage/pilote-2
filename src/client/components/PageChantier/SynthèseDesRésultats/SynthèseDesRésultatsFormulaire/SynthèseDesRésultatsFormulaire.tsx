import { useState, FormEvent, useCallback } from 'react';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import météos from '@/client/constants/météos';
import { Météo, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import Titre from '@/components/_commons/Titre/Titre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsFormulaireStyled from './SynthèseDesRésultatsFormulaire.styled';
import SynthèseDesRésultatsFormulaireProps from './SynthèseDesRésultatsFormulaire.interface';

export default function SynthèseDesRésultatsFormulaire({ contenuInitial, météoInitiale, limiteDeCaractères, àLaPublication, àLAnnulation, alerte }: SynthèseDesRésultatsFormulaireProps) {
  const [contenu, setContenu] = useState(contenuInitial ?? '');
  const [météo, setMétéo] = useState(météoInitiale ?? 'NON_RENSEIGNEE');

  const saisieContenuEstValide = useCallback(() => {
    return contenu.length > 0 && contenu.length <= limiteDeCaractères;
  }, [contenu.length, limiteDeCaractères]);

  const saisieMétéoEstValide = useCallback(() => {
    return météo === 'NON_RENSEIGNEE';
  }, [météo]);

  const formulaireEstInvalide = useCallback(() => {
    return !saisieContenuEstValide() || !saisieMétéoEstValide();
  }, [saisieContenuEstValide, saisieMétéoEstValide]);

  const soumettreLeFormulaire = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formulaireEstInvalide()) {
      return;
    }

    àLaPublication(contenu, météo);
  };
  
  return (
    <SynthèseDesRésultatsFormulaireStyled
      method="post"
      onSubmit={soumettreLeFormulaire}
    >
      <Titre
        baliseHtml='h3'
        className='fr-h5'
      >
        Ajouter une synthèse des résultats
      </Titre>
      <p className='fr-text--xs texte-gris'>
        {`Résumez l’état d’avancement du chantier en maximum ${limiteDeCaractères} caractères. Précisez si vous souhaitez solliciter du soutien pour déployer une action particulièrement efficace ou pour répondre à une difficulté.`}
      </p>
      <div className={`fr-mb-0 fr-input-group ${!saisieContenuEstValide() && 'fr-input-group--error'}`}>
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          onChange={(e) => setContenu(e.target.value)}
          rows={6}
          value={contenu}
        />
        <CompteurCaractères
          compte={contenu.length}
          limiteDeCaractères={limiteDeCaractères}
        />
        {
          contenu.length > limiteDeCaractères && (
            <p className="fr-error-text">
              {`La limite maximale de ${limiteDeCaractères} caractères a été dépassée`}
            </p>
          )
        }
      </div>
      <Sélecteur
        htmlName='météo'
        libellé="Météo"
        options={météosSaisissables.map(optionMétéo => ({ libellé: météos[optionMétéo], valeur: optionMétéo }))}
        setValeur={valeurMétéo => setMétéo(valeurMétéo as Météo)}
        texteFantôme="Météo à renseigner"
        valeur={météosSaisissables.includes(météo) ? météo : ''}
      />
      <MétéoPicto météo={météo} />
      {
        !!alerte && (
          <Alerte
            message={alerte.message}
            type={alerte.type}
          />
        )
      }
      <div className='actions'>
        <button
          className='fr-btn fr-mr-3w'
          disabled={formulaireEstInvalide()}
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
    </SynthèseDesRésultatsFormulaireStyled>
  );
}
