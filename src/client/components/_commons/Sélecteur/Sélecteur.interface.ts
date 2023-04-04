type SélecteurOption = {
  libellé: string,
  valeur: string,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurProps {
  htmlName: string,
  valeur?: string | null,
  setValeur: (valeur: string) => void,
  options: SélecteurOption[],
  libellé?: string,
  texteFantôme?: string,
}
