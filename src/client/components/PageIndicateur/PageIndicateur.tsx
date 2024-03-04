import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import PageIndicateurStyled from '@/components/PageIndicateur/PageIndicateur.styled';
import PageIndicateurProps from '@/components/PageIndicateur/PageIndicateur.interface';
import FicheIndicateur from '@/components/PageIndicateur/FicheIndicateur/FicheIndicateur';
import { usePageIndicateur } from '@/components/PageIndicateur/usePageIndicateur';
import Alerte from '@/components/_commons/Alerte/Alerte';

export default function PageIndicateur({ indicateur, mapInformationMetadataIndicateur, estUneCréation, modificationReussie, creationReussie, chantiers }: PageIndicateurProps) {
  const chemin = [{ nom:'Gestion des indicateurs', lien:'/admin/indicateurs' }];

  const { reactHookForm, modifierIndicateur, creerIndicateur, estEnCoursDeModification, setEstEnCoursDeModification, alerte, reinitialiserIndicateur } = usePageIndicateur(indicateur);

  return (
    <PageIndicateurStyled className='fr-pt-2w'>
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Indicateur'
        />
        <div className='fiche-indicateur fr-pt-1w fr-pb-13w'>
          {
            !!alerte && (
              <div className='fr-mt-2w'>
                <Alerte
                  titre={alerte.titre}
                  type={alerte.type}
                />
              </div>
            )
          }
          <FormProvider {...reactHookForm}>
            <form
              method='post'
              onSubmit={reactHookForm.handleSubmit((data) => {
                if (estUneCréation) {
                  creerIndicateur({ ...data, indicId: indicateur.indicId });
                } else {
                  modifierIndicateur({ ...data, indicId: indicateur.indicId });
                }
              })}
            >
              <Link
                aria-label='Retour à la liste des indicateurs'
                className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour'
                href='/admin/indicateurs'
              >
                Retour
              </Link>
              {
                  !!modificationReussie &&
                  <div className='fr-my-4w'>
                    <Alerte
                      message='Les modifications ont bien été prises en compte pour cet indicateur. Elles apparaitront dans PILOTE lors de la prochaine mise à jour de données'
                      titre="Bravo, l'indicateur a bien été modifié !"
                      type='succès'
                    />
                  </div>
              }
              {
                  !!creationReussie &&
                  <div className='fr-my-4w'>
                    <Alerte
                      message='La création a bien été prise en compte pour cet indicateur. Il apparaitra dans PILOTE lors de la prochaine mise à jour de données'
                      titre="Bravo, l'indicateur a bien été crée !"
                      type='succès'
                    />
                  </div>
              }
              <Titre
                baliseHtml='h1'
                className='fr-h1 fr-mt-4w'
              >
                Fiche de l'indicateur 
                {' '}
                { indicateur.indicId }
                <div className='fr-grid-row fr-mt-4w'>
                  {
                    estUneCréation ? (
                      <button
                        className='fr-btn fr-mr-2w'
                        key='submit-creer-indicateur-top'
                        type='submit'
                      >
                        Créer l'indicateur
                      </button>
                    ) : (estEnCoursDeModification ? (
                      <>
                        <button
                          className='fr-btn fr-mr-2w'
                          key='submit-modifier-indicateur-top'
                          type='submit'
                        >
                          Confirmer les changements
                        </button>
                        <button
                          className='fr-btn fr-btn--secondary fr-mr-2w'
                          key='submit-reinitialiser-indicateur-top'
                          onClick={reinitialiserIndicateur}
                          type='button'
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        className='fr-btn fr-mr-2w'
                        key='passer-en-modification'
                        onClick={() => setEstEnCoursDeModification(!estEnCoursDeModification)}
                        type='button'
                      >
                        Modifier
                      </button>
                    ))
                  }
                </div>
              </Titre>
              <Bloc>
                <div className='fr-py-4w fr-px-10w'>
                  <FicheIndicateur
                    chantiers={chantiers}
                    estEnCoursDeModification={estUneCréation || estEnCoursDeModification}
                    indicateur={indicateur}
                    mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
                  />
                  {
                    estUneCréation ? (
                      <button
                        className='fr-btn fr-mr-2w'
                        key='submit-creer-indicateur-top'
                        type='submit'
                      >
                        Créer l'indicateur
                      </button>
                    ) : (estEnCoursDeModification ? (
                      <>
                        <button
                          className='fr-btn fr-mr-2w'
                          key='submit-modifier-indicateur-top'
                          type='submit'
                        >
                          Confirmer les changements
                        </button>
                        <button
                          className='fr-btn fr-btn--secondary fr-mr-2w'
                          key='submit-reinitialiser-indicateur-top'
                          onClick={reinitialiserIndicateur}
                          type='button'
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        className='fr-btn fr-mr-2w'
                        key='passer-en-modification'
                        onClick={() => setEstEnCoursDeModification(!estEnCoursDeModification)}
                        type='button'
                      >
                        Modifier
                      </button>
                    ))
                  }
                </div>
              </Bloc>
            </form>
          </FormProvider>
          
        </div>
      </main>
    </PageIndicateurStyled>
  );
}
