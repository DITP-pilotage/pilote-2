import { FunctionComponent } from "react";
import { FormProvider } from "react-hook-form";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/client/components/_commons/Bloc/Bloc";
import { useGestionTokenAPI } from "@/components/PageAdminGestionTokenAPI/useGestionTokenAPI";
import Alerte from "@/components/_commons/Alerte/Alerte";
import TokenAPIForm from "@/components/PageAdminGestionTokenAPI/TokenAPIForm/TokenAPIForm";
import {
  Tableau,
  TableauCellule,
  TableauCelluleEnTete,
  TableauCorps,
  TableauEnTete,
  TableauLigne,
} from "@/components/shared/Tableau";
import { TokenAPIInformationContrat } from "@/server/authentification/app/contrats/TokenAPIInformationContrat";

const PageAdminGestionTokenAPI: FunctionComponent<{
  listeTokenAPIInformation: TokenAPIInformationContrat[];
  suppressionReussie: boolean;
}> = ({ listeTokenAPIInformation, suppressionReussie }) => {
  const { reactHookForm, creerTokenAPI, alerte, supprimerTokenAPI } =
    useGestionTokenAPI();

  return (
    <div className="flex">
      <main>
        <div className="fr-mt-2w fr-mb-3w">
          <div className="fr-container">
            <Titre baliseHtml="h1" className="fr-h1 fr-mb-2w">
              Gestion des tokens API
            </Titre>
            <Bloc>
              {alerte ? (
                <div className="fr-my-2w">
                  <Alerte
                    message={alerte.message}
                    titre={alerte.titre}
                    type={alerte.type}
                  />
                </div>
              ) : null}
              {suppressionReussie ? (
                <div className="fr-my-2w">
                  <Alerte
                    message="Le token a correctement été supprimé, le consommateur ne pourra plus l'utiliser"
                    titre="Suppression réussie"
                    type="succès"
                  />
                </div>
              ) : null}
              <FormProvider {...reactHookForm}>
                <form
                  method="put"
                  onSubmit={reactHookForm.handleSubmit((data) => {
                    creerTokenAPI(data);
                  })}
                >
                  <TokenAPIForm />
                </form>
              </FormProvider>
              <div className="fr-container fr-mt-2w w-full">
                <Tableau className="mb-10">
                  <TableauEnTete>
                    <tr>
                      <TableauCelluleEnTete>Émail</TableauCelluleEnTete>
                      <TableauCelluleEnTete>
                        Date d'expiration
                      </TableauCelluleEnTete>
                      <TableauCelluleEnTete>Action</TableauCelluleEnTete>
                    </tr>
                  </TableauEnTete>
                  <TableauCorps>
                    {listeTokenAPIInformation.map((tokenAPIInformation) => (
                      <TableauLigne key={tokenAPIInformation.email}>
                        <TableauCellule>
                          {tokenAPIInformation.email}
                        </TableauCellule>
                        <TableauCellule>
                          {tokenAPIInformation.dateExpiration}
                        </TableauCellule>
                        <TableauCellule>
                          <button
                            aria-controls="supprimer-token"
                            className="fr-btn"
                            onClick={() =>
                              supprimerTokenAPI({
                                email: tokenAPIInformation.email,
                              })
                            }
                            type="button"
                          >
                            Supprimer le token API
                          </button>
                        </TableauCellule>
                      </TableauLigne>
                    ))}
                  </TableauCorps>
                </Tableau>
              </div>
            </Bloc>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageAdminGestionTokenAPI;
