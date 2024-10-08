export type SélecteurAvecRechercheOption<T> = {
  libellé: string,
  valeur: T,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurAvecRechercheProps<T> {
  htmlName: string,
  options: SélecteurAvecRechercheOption<T>[],
  erreurMessage?: string,
  estVueMobile: boolean,
  estVisibleEnMobile: boolean,
  valeurModifiéeCallback?: (valeur: T) => void,
  valeurSélectionnée?: T,
  libellé?: string,
}
