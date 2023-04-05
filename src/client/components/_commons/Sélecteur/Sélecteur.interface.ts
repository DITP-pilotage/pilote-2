type SélecteurOption<T> = {
  libellé: string,
  valeur: T,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurProps<T> {
  htmlName: string,
  setValeurSélectionnée: (valeur: T) => void,
  options: SélecteurOption<T>[],
  valeurSélectionnée?: T,
  libellé?: string,
  texteFantôme?: string,
}
