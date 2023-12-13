export type SélecteurAvecRechercheOption<T> = {
  libellé: string,
  valeur: T,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurAvecRechercheProps<T> {
  htmlName: string,
  options: SélecteurAvecRechercheOption<T>[],
  valeurModifiéeCallback?: (valeur: T) => void,
  valeurSélectionnée?: T,
  libellé?: string,
}
