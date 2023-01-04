export default interface CartographieProps {
  données: {
    codeInsee: string,
    valeur: number
  }[]
  afficherFrance?: boolean
}
