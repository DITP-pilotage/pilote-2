export type SélecteurCustomOption<T> = {
  libellé: string,
  valeur: T,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurCustomProps<T> {
  htmlName: string,
  options: SélecteurCustomOption<T>[],
  valeurModifiéeCallback?: (valeur: T) => void,
  valeurSélectionnée?: T,
}
