import { TableauComplet } from "./typesTableau";
import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { useCallback } from "react";

import { Tableau as TableauHtml } from "@/components/shared/Tableau";
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
    <section className="relative overflow-x-auto">
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
          <TableauHtml>
            <caption className="sr-only">{titre}</caption>
            {!estVueTuile && <TableauEnTête tableau={tableau} />}
            <TableauContenu tableau={tableau} />
          </TableauHtml>
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
