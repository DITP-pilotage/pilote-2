import { TableauComplet } from "./typesTableau";
import "@gouvfr/dsfr/dist/component/table/table.min.css";
import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { useCallback } from "react";

import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import TableauEnTête from "./EnTête/TableauEnTête";
import TableauContenu from "./Contenu/TableauContenu";
import TableauPagination from "./Pagination/TableauPagination";

interface TableauProps<
  TContexteEnTete extends object,
  TContexteCellule extends object,
> {
  tableau: TableauComplet<TContexteEnTete, TContexteCellule>;
  titre: string;
}

export default function Tableau<
  TContexteEnTete extends object,
  TContexteCellule extends object,
>({ tableau, titre }: TableauProps<TContexteEnTete, TContexteCellule>) {
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("sm");

  const changementDePageCallback = useCallback(
    (numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1),
    [tableau],
  );

  return (
    <section className="fr-table fr-m-0 fr-p-0 overflow-x-auto">
      {tableau.getRowModel().rows.length === 0 ? (
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">Aucun élément à afficher</p>
              Vous pouvez modifier vos filtres pour élargir votre recherche.
            </div>
          </div>
        </div>
      ) : (
        <>
          <table className="tableau table">
            <caption className="fr-sr-only">{titre}</caption>
            {!estVueTuile && <TableauEnTête tableau={tableau} />}
            <TableauContenu tableau={tableau} />
          </table>
          <TableauPagination
            changementDePageCallback={changementDePageCallback}
            nombreDePages={tableau.getPageCount()}
            numéroDePageInitiale={1}
          />
        </>
      )}
    </section>
  );
}
