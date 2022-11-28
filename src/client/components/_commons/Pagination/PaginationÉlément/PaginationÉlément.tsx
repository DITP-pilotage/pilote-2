import PaginationÉlémentProps from './PaginationÉlément.interface';

export default function PaginationÉlément({ estLaPageCourante, changementDePageCallback, numéroDePage }: PaginationÉlémentProps) {
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