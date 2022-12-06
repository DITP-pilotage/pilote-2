export default interface PaginationProps {
  nombreDePages: number,
  changementDePageCallback: (numéroDePage: number) => void
  numéroDePageInitiale: number,
}
