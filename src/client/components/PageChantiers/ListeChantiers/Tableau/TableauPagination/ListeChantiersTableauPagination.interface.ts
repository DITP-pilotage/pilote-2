export default interface ListeChantiersTableauPaginationProps {
  nombreDePages: number,
  changementDePageCallback: (numéroDePage: number) => void
  numéroDePageInitiale: number,
}
