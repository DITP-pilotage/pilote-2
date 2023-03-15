import ListeChantiersTableauPaginationÉlémentProps from './ListeChantiersTableauPaginationÉlément.interface';

export default function ListeChantiersTableauPaginationÉlément({ estLaPageCourante, changementDePageCallback, numéroDePage }: ListeChantiersTableauPaginationÉlémentProps) {
  return (
    <li>
      <button
        aria-current={estLaPageCourante ? 'page' : undefined}
        className="fr-pagination__link"
        onClick={() => changementDePageCallback(numéroDePage)}
        type="button"
      >
        {numéroDePage}
      </button>
    </li>
  );
}
