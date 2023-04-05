import { UseFormRegisterReturn } from 'react-hook-form';

type SélecteurOption<T> = {
  libellé: string,
  valeur: T,
  désactivée?: boolean,
  cachée?: boolean,
};

export default interface SélecteurProps<T> {
  htmlName: string,
  options: SélecteurOption<T>[],
  valeurModifiéeCallback?: (valeur: T) => void,
  valeurSélectionnéeParDéfaut?: T,
  libellé?: string,
  texteFantôme?: string,
  register?: UseFormRegisterReturn
}
