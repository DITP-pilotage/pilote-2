export default interface PaginationÉlémentProps {
  numéroDePage: number
  estLaPageCourante: boolean
  changementDePageCallback:  (numéroDePage: number) => void
}