export default interface TableauPaginationÉlémentProps {
  numéroDePage: number
  estLaPageCourante: boolean
  changementDePageCallback:  (numéroDePage: number) => void
}
