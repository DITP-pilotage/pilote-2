import { FunctionComponent, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import Modale from '@/components/_commons/Modale/Modale';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';

import useModalePropositonValeurActuelle
  from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositonValeurActuelle/useModalePropositonValeurActuelle';
import Input from '@/components/_commons/Input/Input';
import { formaterDate } from '@/client/utils/date/date';
import TextAreaAvecLabel from '@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel';

enum EtapePropositionValeurActuelle {
  SAISIE_VALEUR_ACTUELLE = 'SAISIE_VALEUR_ACTUELLE',
  VALIDATION_VALEUR_ACTUELLE = 'VALIDATION_VALEUR_ACTUELLE',
}

const Stepper: Record<EtapePropositionValeurActuelle[keyof EtapePropositionValeurActuelle & number], {
  numeroEtape: number,
  titre: string,
  etapeSuivante: string | null
}> = {
  [EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE]: {
    numeroEtape: 1,
    titre: 'Saisie de la proposition',
    etapeSuivante: 'Validation de la proposition',
  },
  [EtapePropositionValeurActuelle.VALIDATION_VALEUR_ACTUELLE]: {
    numeroEtape: 2,
    titre: 'Validation de la proposition',
    etapeSuivante: null,
  },
};

const ModalePropositonValeurActuelle: FunctionComponent<{
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur
  generatedHTMLID: string
}> = ({ indicateur, detailIndicateur, generatedHTMLID }) => {

  const { reactHookForm, creerPropositonValeurActuelle, submitSuccess } = useModalePropositonValeurActuelle({
    indicateur,
    detailIndicateur,
  });

  const [etapePropositionValeurActuelle, setEtapePropositionValeurActuelle] = useState<EtapePropositionValeurActuelle>(EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE);

  return (
    <Modale
      idHtml={generatedHTMLID}
      tailleModale='lg'
    >
      <div className='fr-stepper fr-mb-1w'>
        <h2 className='fr-stepper__title'>
          <span>
            {`${Stepper[etapePropositionValeurActuelle].titre}`}
          </span>
          <span className='fr-stepper__state'>
            {`Proposition d'une autre valeur actuelle - Étape ${Stepper[etapePropositionValeurActuelle].numeroEtape} sur 2`}
          </span>
        </h2>
        <div
          className='fr-stepper__steps'
          data-fr-current-step={Stepper[etapePropositionValeurActuelle].numeroEtape}
          data-fr-steps='2'
        />
        {
          Stepper[etapePropositionValeurActuelle].etapeSuivante ? (
            <p className='fr-stepper__details'>
              <span className='fr-text--bold'>
                Étape suivante :
              </span>
              {` ${Stepper[etapePropositionValeurActuelle].etapeSuivante}`}
            </p>
          ) : null
        }
      </div>
      <FormProvider {...reactHookForm}>
        <form
          method='post'
          onSubmit={reactHookForm.handleSubmit(creerPropositonValeurActuelle)}
        >
          {
            etapePropositionValeurActuelle === EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE ? (
              <>

                <h2 className='fr-h4'>
                  {indicateur.nom}
                </h2>
                <div className='w-full flex fr-mt-2w'>
                  <div className='w-half-full fr-mr-1w border flex flex-column'>
                    <span className='fr-background-action-low-blue-france flex justify-center fr-p-1w border'>
                      Valeur actuelle importée par la direction de projet
                    </span>
                    <div className='w-full flex flex-column justify-between fr-pt-2w'>
                      <span className='flex justify-center fr-mb-5v'>
                        {detailIndicateur.valeurActuelle}
                      </span>
                      <span className='flex justify-center align-end texte-gris'>
                        (
                        {formaterDate(detailIndicateur.dateValeurActuelle, 'MM/YYYY')}
                        )
                      </span>
                    </div>
                  </div>
                  <div className='w-half-full fr-ml-1w border'>
                    <span className='fr-background-action-low-blue-france w-full flex justify-center fr-p-1w'>
                      Proposition de nouvelle valeur actuelle
                    </span>
                    <div className='w-full flex flex-column align-center fr-pt-2w'>
                      <div className='w-half-full flex fr-mb-1w'>
                        <Input
                          erreurMessage={reactHookForm.formState.errors.valeurActuelle?.message}
                          htmlName='valeurActuelle'
                          register={reactHookForm.register('valeurActuelle')}
                          type='text'
                        />
                      </div>
                      <span className='flex justify-center texte-gris'>
                        (
                        {formaterDate(detailIndicateur.dateValeurActuelle, 'MM/YYYY')}
                        )
                      </span>
                    </div>
                  </div>
                </div>
                <div className='fr-mt-1w'>
                  <TextAreaAvecLabel
                    erreurMessage={reactHookForm.formState.errors.motifProposition?.message}
                    htmlName='motifProposition'
                    libellé='Motif de la proposition'
                    register={reactHookForm.register('motifProposition')}
                  />
                </div>
                <div className='fr-mt-1w'>
                  <TextAreaAvecLabel
                    erreurMessage={reactHookForm.formState.errors.sourceDonneeEtMethodeCalcul?.message}
                    htmlName='sourceDonneeEtMethodeCalcul'
                    libellé='Sources des données et méthode de calcul'
                    register={reactHookForm.register('sourceDonneeEtMethodeCalcul')}
                  />
                </div>
                <div className='w-full flex justify-end fr-mt-2w'>
                  <button
                    className='fr-btn'
                    disabled={Object.keys(reactHookForm.formState.errors).length > 0}
                    onClick={() => setEtapePropositionValeurActuelle(EtapePropositionValeurActuelle.VALIDATION_VALEUR_ACTUELLE)}
                    type='button'
                  >
                    Étape suivante
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>
                  Veuillez vérifier si la proposition ci-dessous est correcte et prête pour publication immédiate. Après publication, il vous sera toujours possible de modifier ou de supprimer votre proposition.
                </span>
                <div className='fr-callout fr-py-2w fr-mt-2w'>
                  <h3 className='fr-callout__title'>
                    {indicateur.nom}
                  </h3>
                  <p className='fr-callout__text fr-text--sm'>
                    <span className='fr-text--bold'>
                      Valeur actuelle proposée le
                      {' '}
                      {`${formaterDate(new Date().toISOString(), 'DD/MM/YYYY')}`}
                      {' '}
                      par Léon Zitrone :
                      {' '}
                      {reactHookForm.getValues('valeurActuelle')}
                      {' '}
                      (
                      {formaterDate(detailIndicateur.dateValeurActuelle, 'MM/YYYY')}
                      )
                    </span>
                  </p>
                  <p className='fr-callout__text fr-text--sm'>
                    <span className='fr-text--bold'>
                      Motif de la proposition :
                    </span>
                    {' '}
                    {reactHookForm.getValues('motifProposition')}
                  </p>
                  <p className='fr-callout__text fr-text--sm'>
                    <span className='fr-text--bold'>
                      Source des données et méthode de calcul :
                    </span>
                    {' '}
                    {reactHookForm.getValues('sourceDonneeEtMethodeCalcul')}
                  </p>
                </div>
                {
                  submitSuccess ? (
                    <div className='fr-alert fr-alert--success'>
                      <h3 className='fr-alert__title'>
                        La proposition de valeur actuelle a correctement été prise en compte, vous pouvez fermer cette
                        modale.
                      </h3>
                      <span>
                        La proposition de valeur actuelle s'affichera dans le tableau des indicateurs dans une heure.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className='fr-alert fr-alert--info'>
                        <h3 className='fr-alert__title'>
                          Rappel sur le statut de votre proposition
                        </h3>
                        <p>
                          Nous vous rappelons que la valeur actuelle que vous proposez ne sera pas prise en compte dans
                          le
                          calcul du taux d’avancement global de la PPG.
                          À moins que votre proposition soit intégrée par la direction de projet, elle ne sera plus
                          visible
                          dans l’historique de l’indicateur à la prochaine mise à jour. Elle sera cependant conservée
                          dans la
                          base de données de PILOTE.
                        </p>
                      </div>
                      <div className='w-full flex justify-end fr-mt-2w'>
                        <button
                          className='fr-btn fr-btn--secondary fr-mr-2w'
                          onClick={() => setEtapePropositionValeurActuelle(EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE)}
                          type='button'
                        >
                          Étape précédente
                        </button>
                        <button
                          className='fr-btn'
                          type='submit'
                        >
                          Publier la proposition
                        </button>
                      </div>
                    </>
                  )
                }
              </>
            )
          }
        </form>
      </FormProvider>
    </Modale>
  );
};

export default ModalePropositonValeurActuelle;
