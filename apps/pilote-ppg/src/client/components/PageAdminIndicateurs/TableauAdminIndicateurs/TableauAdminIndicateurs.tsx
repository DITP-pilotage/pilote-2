import { FunctionComponent } from "react";
import useTableauPageAdminIndicateurs from "@/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import Titre from "@/components/_commons/Titre/Titre";
import TableauEnTête from "@/components/_commons/Tableau/EnTête/TableauEnTête";
import { MetadataParametrageIndicateurInformationContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import TableauAdminIndicateursContenu from "@/components/PageAdminIndicateurs/TableauAdminIndicateurs/Contenu/TableauAdminIndicateursContenu";
import TableauPagination from "@/components/_commons/Tableau/Pagination/TableauPagination";
import InputFichier from "@/components/_commons/InputFichier/InputFichier";
import { SubmitBouton } from "@/components/_commons/SubmitBouton/SubmitBouton";
import Alerte from "@/components/_commons/Alerte/Alerte";

const TableauAdminIndicateurs: FunctionComponent = () => {
  const {
    tableau,
    file,
    alerte,
    définirLeFichier,
    verifierLeFichier,
    estEnChargement,
    changementDePageCallback,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    exporterLesIndicateurs,
  } = useTableauPageAdminIndicateurs();

  return (
    <section>
      {!!alerte && (
        <div className="fr-mt-2w">
          <Alerte
            message={alerte.message}
            titre={alerte.titre}
            type={alerte.type}
          />
        </div>
      )}
      <div className="fr-container--fluid">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="w-full max-w-[20.5rem]">
              <BarreDeRecherche
                changementDeLaRechercheCallback={
                  changementDeLaRechercheCallback
                }
                valeur={valeurDeLaRecherche}
              />
            </div>
          </div>
          <div className="fr-col-12 fr-col-md-6">
            <form
              className="flex flex-col items-center min-[576px]:items-start min-[1050px]:flex-row min-[1050px]:items-center"
              onSubmit={
                verifierLeFichier as React.FormEventHandler<HTMLFormElement>
              }
            >
              <InputFichier accept=".csv" onChange={définirLeFichier} />
              <SubmitBouton
                className="fr-my-2w fr-my-md-1w fr-text--sm no-wrap"
                disabled={!file}
                label="Importer en masse"
              />
            </form>
          </div>
        </div>
      </div>
      {estEnChargement ? (
        <Loader />
      ) : (
        <>
          <div className="fr-container--fluid fr-mb-2w fr-mt-4w">
            <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-0 fr-text-title--blue-france"
                >
                  {tableau.getFilteredRowModel().rows.length}{" "}
                  {tableau.getFilteredRowModel().rows.length > 1
                    ? "indicateurs"
                    : "indicateur"}
                </Titre>
              </div>
              <div className="fr-col-12 fr-col-md-6 flex justify-center min-[576px]:justify-start min-[1050px]:justify-end">
                <button
                  className="fr-btn fr-text"
                  disabled={tableau.getFilteredRowModel().rows.length === 0}
                  onClick={exporterLesIndicateurs}
                  title="Export les indicateurs"
                  type="button"
                >
                  Exporter{" "}
                  {`${tableau.getFilteredRowModel().rows.length === 1 ? "l'indicateur" : `les ${tableau.getFilteredRowModel().rows.length} indicateurs`}`}
                </button>
              </div>
            </div>
          </div>
          <div className="fr-table">
            <table className="tableau table fr-m-0 fr-p-0 w-full">
              <caption className="fr-sr-only">Tableau des indicateurs</caption>
              <TableauEnTête<MetadataParametrageIndicateurInformationContrat>
                tableau={tableau}
              />
              <TableauAdminIndicateursContenu tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default TableauAdminIndicateurs;
