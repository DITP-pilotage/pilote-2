import "@gouvfr/dsfr/dist/component/table/table.min.css";
import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { FunctionComponent } from "react";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import TableauPagination from "@/components/_commons/TableauNew/Pagination/TableauPagination";
import { useTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers";
import { TableauChantiersActionsDeTri } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiersActionsDeTri";
import TableauRéformesEnTête from "@/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête";
import { SelecteurGroupementTableauChantier } from "./SelecteurGroupementTableauChantier";
import TableauChantiersProps from "./TableauChantiers.interface";
import TableauChantiersContenu from "./Contenu/TableauChantiersContenu";

const TableauChantiers: FunctionComponent<TableauChantiersProps> = ({
  nombreTotalChantiersAvecAlertes,
  données,
  ministèresDisponibles,
  territoireCode,
  jalon,
  chantiersSontArchives,
}) => {
  const {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    estVueTuile,
  } = useTableauChantiers(
    données,
    ministèresDisponibles,
    nombreTotalChantiersAvecAlertes,
    chantiersSontArchives,
    jalon,
  );

  return (
    <section className="fr-table fr-m-0 fr-p-0 text-dsfr-grey-50 [&_nav_button]:rounded">
      <div className="flex flex-col justify-between md:flex-row gap-4 md:items-end w-full mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-80">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
        </div>
        <div className="flex md:flex-row gap-4 items-end">
          <SelecteurGroupementTableauChantier />
          <TableauChantiersActionsDeTri />
        </div>
      </div>
      {tableau.getRowModel().rows.length === 0 ? (
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">
                Aucun chantier ne correspond à votre recherche !
              </p>
              Vous pouvez modifier vos filtres pour élargir votre recherche.
            </div>
          </div>
        </div>
      ) : (
        <>
          <table className="tableau table">
            <caption className="fr-sr-only">Liste des chantiers</caption>
            {!estVueTuile ? <TableauRéformesEnTête tableau={tableau} /> : null}
            <TableauChantiersContenu
              chantiersSontArchives={chantiersSontArchives}
              jalon={jalon}
              tableau={tableau}
              territoireCode={territoireCode}
            />
          </table>
          <TableauPagination
            initialPageSize={50}
            nombreDePages={tableau.getPageCount()}
            tableau={tableau}
          />
        </>
      )}
    </section>
  );
};

export default TableauChantiers;
