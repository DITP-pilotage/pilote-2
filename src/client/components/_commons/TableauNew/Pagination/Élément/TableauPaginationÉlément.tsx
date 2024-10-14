import TableauPaginationÉlémentProps from './TableauPaginationÉlément.interface';

export default function TableauPaginationÉlément({ estLaPageCourante, changementDePageCallback, numéroDePage }: TableauPaginationÉlémentProps) {
  return (
    <li>
      <button
        aria-current={estLaPageCourante ? 'page' : undefined}
        className='fr-pagination__link'
        onClick={() => changementDePageCallback(numéroDePage)}
        title={numéroDePage.toString()}
        type='button'
      >
        {numéroDePage}
      </button>
    </li>
  );
}
