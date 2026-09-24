import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import { PaginationCompacte } from "@/components/_commons/PaginationCompacte/PaginationCompacte";
import {
  TAILLES_DE_PAGE_CHANTIERS,
  useTableauIndicateursNonAJour,
} from "./useTableauIndicateursNonAJour";
import { FiltresIndicateurs } from "./FiltresIndicateurs";
import { CarteChantier } from "./CarteChantier";

const TableauIndicateursNonAJour = ({
  indicateurs,
}: {
  indicateurs: IndicateurNonAJour[];
}) => {
  const { tableau, pagination, ...filtres } =
    useTableauIndicateursNonAJour(indicateurs);
  const groupes = tableau.getRowModel().rows;
  const nombreDePages = tableau.getPageCount();
  const afficherPagination =
    tableau.getPrePaginatedRowModel().rows.length >
    TAILLES_DE_PAGE_CHANTIERS[0];

  return (
    <div className="flex flex-col gap-5">
      <FiltresIndicateurs {...filtres} />
      {groupes.length === 0 ? (
        <p className="fr-text--sm text-dsfr-mention-grey">
          Aucun indicateur ne correspond à vos filtres.
        </p>
      ) : (
        groupes.map((groupe) => (
          <CarteChantier groupe={groupe} key={groupe.id} />
        ))
      )}
      {afficherPagination ? (
        <PaginationCompacte
          changementDePageCallback={(numeroDePage) =>
            tableau.setPageIndex(numeroDePage - 1)
          }
          changementTailleDePageCallback={(tailleDePage) =>
            tableau.setPageSize(tailleDePage)
          }
          libelleTaillePage="Chantiers par page :"
          nombreDePages={nombreDePages}
          numeroDePageCourante={pagination.pageIndex + 1}
          tailleDePage={pagination.pageSize}
          taillesDePage={TAILLES_DE_PAGE_CHANTIERS}
        />
      ) : null}
    </div>
  );
};

export default TableauIndicateursNonAJour;
