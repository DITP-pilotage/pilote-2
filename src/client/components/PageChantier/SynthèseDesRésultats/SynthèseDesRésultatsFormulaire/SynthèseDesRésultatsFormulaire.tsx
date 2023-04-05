import { useState } from 'react';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import météos from '@/client/constants/météos';
import { Météo, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import Titre from '@/components/_commons/Titre/Titre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsFormulaireStyled from './SynthèseDesRésultatsFormulaire.styled';
import SynthèseDesRésultatsFormulaireProps from './SynthèseDesRésultatsFormulaire.interface';
import useSynthèseDesRésultatsFormulaire from './useSynthèseDesRésultatsFormulaire';

export default function SynthèseDesRésultatsFormulaire({ contenuInitial, météoInitiale, limiteDeCaractères, synthèseDesRésultatsCrééeCallback, annulationCallback }: SynthèseDesRésultatsFormulaireProps) {
  const [contenu, setContenu] = useState(contenuInitial ?? '');
  const [météo, setMétéo] = useState(météoInitiale ?? 'NON_RENSEIGNEE');

  const { 
    contenuADépasséLaLimiteDeCaractères,
    formulaireEstInvalide,
    soumettreLeFormulaire, 
    alerte, 
  } = useSynthèseDesRésultatsFormulaire(limiteDeCaractères, synthèseDesRésultatsCrééeCallback, contenu, météo);  

  return (
    <SynthèseDesRésultatsFormulaireStyled
      method="post"
      onSubmit={soumettreLeFormulaire}
    >
      <Titre
        baliseHtml='h3'
        className='fr-h5 fr-mb-1v'
      >
        Modifier la météo et la synthèse des résultats
      </Titre>
      <p className='fr-text--xs fr-mb-1w texte-gris'>
        {`Résumez l’état d’avancement du chantier en maximum ${limiteDeCaractères} caractères. Précisez si vous souhaitez solliciter du soutien pour déployer une action particulièrement efficace ou pour répondre à une difficulté.`}
      </p>
      <div className={`fr-mb-0 fr-input-group ${contenuADépasséLaLimiteDeCaractères && 'fr-input-group--error'}`}>
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
          !!contenuADépasséLaLimiteDeCaractères && 
            <p className="fr-error-text">
              {`La limite maximale de ${limiteDeCaractères} caractères a été dépassée`}
            </p>
        }
      </div>
      <div className="fr-mt-1v flex partie-basse">
        <Sélecteur
          htmlName='météo'
          libellé="Météo"
          options={météosSaisissables.map(optionMétéo => ({ libellé: météos[optionMétéo], valeur: optionMétéo }))}
          setValeur={valeurMétéo => setMétéo(valeurMétéo as Météo)}
          texteFantôme="Météo à renseigner"
          valeur={météosSaisissables.includes(météo) ? météo : ''}
        />
        <div className="fr-px-3w">
          <MétéoPicto météo={météo} />
        </div>
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
            onClick={annulationCallback}
            type='button'
          >
            Annuler
          </button>
        </div>
      </div>
      {
        !!alerte && (
        <div className="fr-mt-2w">
          <Alerte
            message={alerte.message}
            type={alerte.type}
          />
        </div>
        )
      }
    </SynthèseDesRésultatsFormulaireStyled>
  );
}
