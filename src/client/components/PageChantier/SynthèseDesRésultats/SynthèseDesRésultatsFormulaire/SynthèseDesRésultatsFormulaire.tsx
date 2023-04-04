import { useId, useState, FormEvent, useEffect } from 'react';
import { récupérerUnCookie } from '@/client/utils/cookies';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import météos from '@/client/constants/météos';
import { Météo, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import Titre from '@/components/_commons/Titre/Titre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import SynthèseDesRésultatsFormulaireStyled from './SynthèseDesRésultatsFormulaire.styled';
import SynthèseDesRésultatsFormulaireProps from './SynthèseDesRésultatsFormulaire.interface';

export default function SynthèseDesRésultatsFormulaire({ contenuParDéfaut, météoParDéfaut, limiteDeCaractères, àLaSoumission, àLAnnulation }: SynthèseDesRésultatsFormulaireProps) {
  const uniqueId = useId();
  const [contenu, setContenu] = useState(contenuParDéfaut ?? '');
  const [météo, setMétéo] = useState(météoParDéfaut ?? 'NON_RENSEIGNEE');
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

    àLaSoumission(contenu, météo, récupérerUnCookie('csrf') ?? '');
  };

  useEffect(() => {
    if (nombreDeCaractères > limiteDeCaractères) 
      setADépasséLaLimiteDeCaractères(true);
    else
      setADépasséLaLimiteDeCaractères(false);
  }, [nombreDeCaractères, limiteDeCaractères]);
  
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
        Résumez l’état d’avancement du chantier en maximum 5000 caractères. Précisez si vous souhaitez solliciter du soutien pour déployer une action particulièrement efficace ou pour répondre à une difficulté.
      </p>
      <div className={`fr-mb-0 fr-input-group ${aDépasséLaLimiteDeCaractères && 'fr-input-group--error'}`}>
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
        <CompteurCaractères
          compte={nombreDeCaractères}
          limiteDeCaractères={limiteDeCaractères}
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
        <Sélecteur
          htmlName='météo'
          libellé="Météo"
          options={météosSaisissables.map(optionMétéo => ({ libellé: météos[optionMétéo], valeur: optionMétéo }))}
          setValeur={valeurMétéo => setMétéo(valeurMétéo as Météo)}
          texteFantôme="Météo à renseigner"
          valeur={météosSaisissables.includes(météo) ? météo : ''}
        />
        <MétéoPicto météo={météo} />
      </div>
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
    </SynthèseDesRésultatsFormulaireStyled>
  );
}
