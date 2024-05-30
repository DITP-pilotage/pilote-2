import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { FunctionComponent } from 'react';
import { FormProvider } from 'react-hook-form';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/client/components/_commons/Bloc/Bloc';
import { useGestionTokenAPI } from '@/components/PageAdminGestionTokenAPI/useGestionTokenAPI';
import Alerte from '@/components/_commons/Alerte/Alerte';
import { TokenAPIForm } from '@/components/PageAdminGestionTokenAPI/TokenAPIForm/TokenAPIForm';
import { TokenAPIInformationContrat } from '@/server/authentification/app/contrats/TokenAPIInformationContrat';

const PageAdminGestionTokenAPI: FunctionComponent<{
  listeTokenAPIInformation: TokenAPIInformationContrat[],
  suppressionReussie: boolean
}> = ({ listeTokenAPIInformation, suppressionReussie }) => {
  const { reactHookForm, creerTokenAPI, alerte, supprimerTokenAPI } = useGestionTokenAPI();

  return (
    <div className='flex'>
      <main>
        <div className='fr-mt-2w fr-mb-3w'>
          <div className='fr-container'>
            <Titre
              baliseHtml='h1'
              className='fr-h1 fr-mb-2w'
            >
              Gestion des tokens API
            </Titre>
            <Bloc>
              {
                alerte ? (
                  <div className='fr-my-2w'>
                    <Alerte
                      message={alerte.message}
                      titre={alerte.titre}
                      type={alerte.type}
                    />
                  </div>
                ) : null
              }
              {
                suppressionReussie ? (
                  <div className='fr-my-2w'>
                    <Alerte
                      message="Le token a correctement été supprimé, le consommateur ne pourra plus l'utiliser"
                      titre='Suppression réussie'
                      type='succès'
                    />
                  </div>
                ) : null
              }
              <FormProvider {...reactHookForm}>
                <form
                  method='put'
                  onSubmit={reactHookForm.handleSubmit((data) => {
                    creerTokenAPI(data);
                  })}
                >
                  <TokenAPIForm />
                </form>
              </FormProvider>
              <div className='fr-container fr-mt-2w w-full'>
                <table className='fr-table fr-mb-3 fr-p-0 w-full'>
                  <thead>
                    <tr>
                      <th>
                        Émail
                      </th>
                      <th>
                        Date d'expiration
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                    listeTokenAPIInformation.map(tokenAPIInformation => (
                      <tr key={tokenAPIInformation.email}>
                        <td>
                          {tokenAPIInformation.email}
                        </td>
                        <td>
                          {tokenAPIInformation.dateExpiration}
                        </td>
                        <td>
                          <button
                            aria-controls='supprimer-token'
                            className='fr-btn'
                            onClick={() => supprimerTokenAPI({ email: tokenAPIInformation.email })}
                            type='button'
                          >
                            Supprimer le token API
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                  </tbody>
                </table>
              </div>
            </Bloc>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageAdminGestionTokenAPI;
