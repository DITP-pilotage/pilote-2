export default interface ListeChantiersTableauPaginationÉlémentProps {
  numéroDePage: number
  estLaPageCourante: boolean
  changementDePageCallback:  (numéroDePage: number) => void
}
