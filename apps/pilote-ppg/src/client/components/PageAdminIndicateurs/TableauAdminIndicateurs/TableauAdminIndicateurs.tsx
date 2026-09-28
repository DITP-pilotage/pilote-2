import { FunctionComponent } from "react";
import useTableauPageAdminIndicateurs from "@/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import Titre from "@/components/_commons/Titre/Titre";
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
          <tableau.Root
            caption="Tableau des indicateurs"
            captionHidden
            className="m-0 p-0 w-full"
          >
            <tableau.Header
              cellClassName="py-2 md:py-2 px-1 md:px-1 min-[992px]:px-4 first:rounded-tl-lg last:rounded-tr-lg max-[49rem]:!text-xs"
              className="!bg-dsfr-blue-france-925 border border-dsfr-grey-925"
            />
            <tableau.Body
              cellClassName="p-2 md:p-2 max-w-[20px] overflow-hidden text-ellipsis whitespace-nowrap"
              cellTitle
              rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
            />
          </tableau.Root>
          <tableau.Pagination />
        </>
      )}
    </section>
  );
};

export default TableauAdminIndicateurs;
