import { FunctionComponent } from "react";

interface TableauPaginationÉlémentProps {
  numéroDePage: number;
  estLaPageCourante: boolean;
  changementDePageCallback: (numéroDePage: number) => void;
}

const TableauPaginationÉlément: FunctionComponent<
  TableauPaginationÉlémentProps
> = ({ estLaPageCourante, changementDePageCallback, numéroDePage }) => {
  return (
    <li>
      <button
        aria-current={estLaPageCourante ? "page" : undefined}
        className="fr-pagination__link rounded"
        onClick={() => changementDePageCallback(numéroDePage)}
        title={numéroDePage.toString()}
        type="button"
      >
        {numéroDePage}
      </button>
    </li>
  );
};

export default TableauPaginationÉlément;
