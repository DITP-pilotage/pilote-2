export type Élément = {
  nom: string,
  ancre: string,
};
export default interface SommaireProps {
  éléments: [Élément & { sousÉlément?: Élément[] }]
}
