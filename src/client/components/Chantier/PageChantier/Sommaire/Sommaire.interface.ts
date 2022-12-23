export type Rubrique = {
  nom: string,
  ancre: string,
  sousRubriques?: Rubrique[]
};

export default interface SommaireProps {
  rubriques: Rubrique[]
}
