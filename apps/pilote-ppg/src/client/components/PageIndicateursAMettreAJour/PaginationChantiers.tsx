import type { PaginationState } from "@tanstack/react-table";
import { PaginationCompacte } from "@/components/_commons/PaginationCompacte/PaginationCompacte";
import { TAILLES_DE_PAGE_CHANTIERS } from "./tableauChantiers";

export const PaginationChantiers = ({
  nombreDeChantiers,
  nombreDePages,
  pagination,
  setPageIndex,
  setPageSize,
}: {
  nombreDeChantiers: number;
  nombreDePages: number;
  pagination: PaginationState;
  setPageIndex(pageIndex: number): void;
  setPageSize(pageSize: number): void;
}) => {
  if (nombreDeChantiers <= TAILLES_DE_PAGE_CHANTIERS[0]) {
    return null;
  }

  return (
    <PaginationCompacte
      changementDePageCallback={(numeroDePage) =>
        setPageIndex(numeroDePage - 1)
      }
      changementTailleDePageCallback={setPageSize}
      libelleTaillePage="Chantiers par page :"
      nombreDePages={nombreDePages}
      numeroDePageCourante={pagination.pageIndex + 1}
      tailleDePage={pagination.pageSize}
      taillesDePage={TAILLES_DE_PAGE_CHANTIERS}
    />
  );
};
