import { FunctionComponent } from "react";
import { Button } from "@/components/shared/Button";
import { FormProvider } from "react-hook-form";
import Titre from "@/components/_commons/Titre/Titre";
import { Table } from "@/components/shared/Table";
import Bloc from "@/client/components/_commons/Bloc/Bloc";
import { useGestionTokenAPI } from "@/components/PageAdminGestionTokenAPI/useGestionTokenAPI";
import Alerte from "@/components/_commons/Alerte/Alerte";
import TokenAPIForm from "@/components/PageAdminGestionTokenAPI/TokenAPIForm/TokenAPIForm";
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
                <Table.Root
                  caption="Jetons d'API"
                  captionHidden
                  className="w-full"
                  containerClassName="p-0"
                >
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Émail</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        Date d'expiration
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {listeTokenAPIInformation.map((tokenAPIInformation) => (
                      <Table.Row key={tokenAPIInformation.email}>
                        <Table.Cell>{tokenAPIInformation.email}</Table.Cell>
                        <Table.Cell>
                          {tokenAPIInformation.dateExpiration}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            aria-controls="supprimer-token"
                            onClick={() =>
                              supprimerTokenAPI({
                                email: tokenAPIInformation.email,
                              })
                            }
                            variant="primary"
                          >
                            Supprimer le token API
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </div>
            </Bloc>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageAdminGestionTokenAPI;
