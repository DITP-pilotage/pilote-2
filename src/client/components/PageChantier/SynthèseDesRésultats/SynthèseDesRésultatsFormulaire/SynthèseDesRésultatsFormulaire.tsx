import { useState } from 'react';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import météos from '@/client/constants/météos';
import { MétéoSaisissable, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import Titre from '@/components/_commons/Titre/Titre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsFormulaireStyled from './SynthèseDesRésultatsFormulaire.styled';
import SynthèseDesRésultatsFormulaireProps from './SynthèseDesRésultatsFormulaire.interface';
import useSynthèseDesRésultatsFormulaire from './useSynthèseDesRésultatsFormulaire';

export default function SynthèseDesRésultatsFormulaire({ contenuInitial, météoInitiale, limiteDeCaractères, synthèseDesRésultatsCrééeCallback, annulationCallback }: SynthèseDesRésultatsFormulaireProps) {
  const [contenu, setContenu] = useState(contenuInitial ?? '');
  const [météo, setMétéo] = useState<MétéoSaisissable | null>(météoInitiale && météosSaisissables.includes(météoInitiale) ? météoInitiale as MétéoSaisissable : null);
 
  const { 
    contenuADépasséLaLimiteDeCaractères,
    formulaireEstValide,
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
        <div className="flex justifyBetween">
          <div>
            {
              !!contenuADépasséLaLimiteDeCaractères &&
              <p className="fr-error-text fr-mt-0 fr-mr-2w">
                {`La limite maximale de ${limiteDeCaractères} caractères a été dépassée.`}
              </p>
            }
          </div>
          <CompteurCaractères
            compte={contenu.length}
            limiteDeCaractères={limiteDeCaractères}
          />
        </div>
      </div>
      <div className="fr-mt-1v flex partie-basse">
        <Sélecteur<MétéoSaisissable>
          htmlName='météo'
          libellé="Météo"
          options={météosSaisissables.map(optionMétéo => ({ libellé: météos[optionMétéo], valeur: optionMétéo }))}
          setValeurSélectionnée={météoSélectionnée => setMétéo(météoSélectionnée)}
          texteFantôme="Météo à renseigner"
          valeurSélectionnée={météo ?? undefined}
        />
        <div className="fr-mx-3w météo-picto-conteneur">
          {
            !!météo &&
            <MétéoPicto météo={météo} />
          }
        </div>
        <div className='actions'>
          <button
            className='fr-btn fr-mr-3w'
            disabled={!formulaireEstValide}
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
