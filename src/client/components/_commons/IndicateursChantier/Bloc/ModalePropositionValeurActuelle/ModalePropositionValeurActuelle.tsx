import { FunctionComponent } from 'react';
import { FormProvider } from 'react-hook-form';
import Modale from '@/components/_commons/Modale/Modale';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';

import useModalePropositionValeurActuelle, {
  EtapePropositionValeurActuelle,
  Stepper,
} from '@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurActuelle/useModalePropositionValeurActuelle';
import Input from '@/components/_commons/Input/Input';
import { formaterDate } from '@/client/utils/date/date';
import TextAreaAvecLabel from '@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel';

const ModalePropositionValeurActuelle: FunctionComponent<{
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur
  generatedHTMLID: string
  territoireCode: string
}> = ({ indicateur, detailIndicateur, generatedHTMLID, territoireCode }) => {

  const {
    reactHookForm,
    creerPropositonValeurActuelle,
    etapePropositionValeurActuelle,
    setEtapePropositionValeurActuelle,
    auteurModification,
  } = useModalePropositionValeurActuelle({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  return (
    <Modale
      idHtml={generatedHTMLID}
      tailleModale='lg'
    >
      {
        etapePropositionValeurActuelle ? (
          <>
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
                onSubmit={reactHookForm.handleSubmit((data) => {
                  creerPropositonValeurActuelle(data);
                })}
              >
                {
                  etapePropositionValeurActuelle === EtapePropositionValeurActuelle.SAISIE_VALEUR_ACTUELLE ? (
                    <>
                      <h2 className='fr-h4'>
                        {indicateur.nom}
                      </h2>
                      {
                        detailIndicateur.proposition !== null ? (
                          <p className='fr-text--sm fr-mt-1v'>
                            La proposition de nouvelle valeur actuelle que vous éditez a été faite
                            par
                            {' '}
                            {detailIndicateur.proposition.auteur}
                            {' '}
                            le
                            {' '}
                            {formaterDate(detailIndicateur.proposition.dateProposition, 'DD/MM/YYYY')}
                            .
                            Toute modification apportée à cette proposition écrasera et remplacera celle-ci.
                          </p>
                        ) : null
                      }
                      <div className='w-full flex fr-mt-2w'>
                        <div className='w-half-full fr-mr-1w border flex flex-column'>
                          <span className='fr-background-action-low-blue-france flex justify-center fr-p-1w border'>
                            Valeur actuelle importée par la direction de projet
                          </span>
                          <div className='w-full flex flex-column justify-between fr-pt-1w'>
                            <span className='flex justify-center fr-mb-5v'>
                              {detailIndicateur.valeurActuelle?.toLocaleString()}
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
                          <div className='w-full flex flex-column align-center fr-pt-1w'>
                            <div className='w-half-full flex fr-mb-1w'>
                              <Input
                                className='texte-centre'
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
                          isRequired
                          libellé='Motif de la proposition'
                          register={reactHookForm.register('motifProposition', { required: true })}
                        />
                      </div>
                      <div className='fr-mt-1w'>
                        <TextAreaAvecLabel
                          erreurMessage={reactHookForm.formState.errors.sourceDonneeEtMethodeCalcul?.message}
                          htmlName='sourceDonneeEtMethodeCalcul'
                          isRequired
                          libellé='Sources des données et méthode de calcul'
                          register={reactHookForm.register('sourceDonneeEtMethodeCalcul', { required: true })}
                        />
                      </div>
                      <div className='w-full flex justify-end fr-mt-2w'>
                        <button
                          className='fr-btn'
                          disabled={Object.keys(reactHookForm.formState.errors).length > 0 || reactHookForm.getValues('motifProposition').length === 0 || reactHookForm.getValues('sourceDonneeEtMethodeCalcul').length === 0}
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
                            par
                            {' '}
                            {auteurModification}
                            {' '}
                            :
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
              </form>
            </FormProvider>
          </>
        ) : (
          <div className='fr-alert fr-alert--success fr-mt-2w'>
            <h3 className='fr-alert__title'>
              La proposition de valeur actuelle a correctement été prise en compte, vous pouvez fermer cette
              modale.
            </h3>
            <span>
              La proposition de valeur actuelle s'affichera dans le tableau des indicateurs dans une heure.
            </span>
          </div>
        )
      }
    </Modale>
  );
};

export default ModalePropositionValeurActuelle;
