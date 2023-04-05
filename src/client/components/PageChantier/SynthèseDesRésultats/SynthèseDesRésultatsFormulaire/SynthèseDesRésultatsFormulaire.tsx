import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import météos from '@/client/constants/météos';
import { MétéoSaisissable, météosSaisissables } from '@/server/domain/météo/Météo.interface';
import Titre from '@/components/_commons/Titre/Titre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SynthèseDesRésultatsValidateur from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.validateur';
import SynthèseDesRésultatsFormulaireStyled from './SynthèseDesRésultatsFormulaire.styled';
import SynthèseDesRésultatsFormulaireProps, { SynthèseDesRésultatsFormulaireInputs } from './SynthèseDesRésultatsFormulaire.interface';
import useSynthèseDesRésultatsFormulaire from './useSynthèseDesRésultatsFormulaire';

export default function SynthèseDesRésultatsFormulaire({ contenuInitial, météoInitiale, synthèseDesRésultatsCrééeCallback, annulationCallback }: SynthèseDesRésultatsFormulaireProps) {
  const { créerSynthèseDesRésultats, alerte } = useSynthèseDesRésultatsFormulaire(synthèseDesRésultatsCrééeCallback);  
  
  const { register, handleSubmit, formState: { errors, isValid }, watch, getValues } = useForm<SynthèseDesRésultatsFormulaireInputs>({
    mode: 'all',
    resolver: zodResolver(SynthèseDesRésultatsValidateur.créer()),
    defaultValues: {
      contenu: contenuInitial,
      météo: météoInitiale && météosSaisissables.includes(météoInitiale) ? météoInitiale as MétéoSaisissable : undefined,
    },
  });

  return (
    <SynthèseDesRésultatsFormulaireStyled
      method="post"
      onSubmit={handleSubmit(créerSynthèseDesRésultats)}
    >
      <Titre
        baliseHtml='h3'
        className='fr-h5 fr-mb-1v'
      >
        Modifier la météo et la synthèse des résultats
      </Titre>
      <p className='fr-text--xs fr-mb-1w texte-gris'>
        {`Résumez l’état d’avancement du chantier en maximum ${SynthèseDesRésultatsValidateur.limiteDeCaractèresContenu} caractères. Précisez si vous souhaitez solliciter du soutien pour déployer une action particulièrement efficace ou pour répondre à une difficulté.`}
      </p>
      <div className={`fr-mb-0 fr-input-group ${errors.contenu && 'fr-input-group--error'}`}>
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          rows={6}
          {...register('contenu')}
        />
        <div className="flex justifyBetween">
          <div>
            {
              !!errors.contenu &&
                <p className="fr-error-text fr-mt-0 fr-mr-2w">
                  {errors.contenu.message}
                </p>
            }
          </div>
          <CompteurCaractères
            compte={watch('contenu')?.length ?? 0}
            limiteDeCaractères={SynthèseDesRésultatsValidateur.limiteDeCaractèresContenu}
          />
        </div>
      </div>
      <div className="fr-mt-1v flex partie-basse">
        <Sélecteur<MétéoSaisissable>
          htmlName='météo'
          libellé="Météo"
          options={météosSaisissables.map(optionMétéo => ({ libellé: météos[optionMétéo], valeur: optionMétéo }))}
          register={{ ...register('météo') }}
          texteFantôme="Météo à renseigner"
          valeurSélectionnéeParDéfaut={getValues('météo')}
        />
        <div className="fr-mx-3w météo-picto-conteneur">
          {
            !!watch('météo') &&
            <MétéoPicto météo={watch('météo')!} />
          }
        </div>
        <div className='actions'>
          <button
            className='fr-btn fr-mr-3w'
            disabled={!isValid}
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
