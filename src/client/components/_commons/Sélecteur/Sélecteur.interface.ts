type SélecteurOption = {
  libellé: string,
  valeur: string,
};

export default interface SélecteurProps {
  htmlName: string,
  valeur: string,
  setValeur: (valeur: string) => void,
  options: SélecteurOption[],
  libellé?: string,
  texteFantôme?: string,
}
