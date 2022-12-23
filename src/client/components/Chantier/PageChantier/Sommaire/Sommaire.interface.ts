export type ÉlémentPageType = {
  nom: string,
  ancre: string,
  sousÉléments?: ÉlémentPageType[]
};

export default interface SommaireProps {
  éléments: ÉlémentPageType[]
}
