export type ContrôleSegmentéOption<T> = {
  libellé: string,
  valeur: T,
};
  
export default interface ContrôleSegmentéProps<T> {
  options: ContrôleSegmentéOption<T>[]
  valeurSélectionnée: T
  valeurModifiéeCallback: (valeur: T) => void
}
