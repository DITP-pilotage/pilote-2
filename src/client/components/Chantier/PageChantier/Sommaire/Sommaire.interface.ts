export default interface SommaireProps {
  éléments: {
    nom: string,
    ancre: string,
    sousÉlément?: { nom: string, ancre: string }[]
  }[]
}
