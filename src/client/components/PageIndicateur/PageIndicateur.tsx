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

export default function PageIndicateur({ indicateur, mapInformationMetadataIndicateur, estUneCréation, chantiers }: PageIndicateurProps) {
  const chemin = [{ nom:'Gestion des indicateurs', lien:'/admin/indicateurs' }];

  const { reactHookForm, modifierIndicateur, creerIndicateur, estEnCoursDeModification, setEstEnCoursDeModification, alerte } = usePageIndicateur(indicateur);

  return (
    <PageIndicateurStyled className='fr-pt-2w'>
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Indicateur'
        />
        <div className='fiche-indicateur fr-pt-1w fr-pb-13w'>

          <FormProvider {...reactHookForm}>
            <form
              method="post"
              onSubmit={reactHookForm.handleSubmit((data) => {
                if (estUneCréation) {
                  creerIndicateur({ ...data, indicId: indicateur.indicId });

                } else {
                  modifierIndicateur({ ...data, indicId: indicateur.indicId });
                }
              })}
            >
              <Link
                aria-label="Retour à la liste des indicateurs"
                className="fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour"
                href='/admin/indicateurs'
              >
                Retour
              </Link>
              <Titre
                baliseHtml='h1'
                className='fr-h1 fr-mt-4w'
              >
                Fiche de l&apos;indicateur 
                {' '}
                { indicateur.indicId }
                <div className="fr-grid-row fr-mt-4w">
                  {
                  estUneCréation ? (
                    <button
                      className='fr-btn fr-mr-2w'
                      key="submit-indicateur"
                      type="submit"
                    >
                      Créer l&apos;indicateur
                    </button>
                  ) : (estEnCoursDeModification ? (
                    <button
                      className='fr-btn fr-mr-2w'
                      key="submit-indicateur"
                      type="submit"
                    >
                      Confirmer les changements
                    </button>

                  ) : (
                    <button
                      className='fr-btn fr-mr-2w'
                      key="passer-en-modification"
                      onClick={() => setEstEnCoursDeModification(!estEnCoursDeModification)}
                      type="button"
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
                        key="submit-indicateur"
                        type="submit"
                      >
                        Créer l&apos;indicateur
                      </button>
                    ) : (estEnCoursDeModification ? (
                      <button
                        className='fr-btn fr-mr-2w'
                        key="submit-indicateur"
                        type="submit"
                      >
                        Confirmer les changements
                      </button>

                    ) : (
                      <button
                        className='fr-btn fr-mr-2w'
                        key="passer-en-modification"
                        onClick={() => setEstEnCoursDeModification(!estEnCoursDeModification)}
                        type="button"
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
        {
            !!alerte && (
            <div className="fr-mt-2w">
              <Alerte
                titre={alerte.titre}
                type={alerte.type}
              />
            </div>
            )
        }
      </main>
    </PageIndicateurStyled>
  );
}
