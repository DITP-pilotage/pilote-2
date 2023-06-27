import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

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
  valeurSélectionnée?: T,
  texteAide?: string,
  erreur?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  libellé?: string,
  texteFantôme?: string,
  register?: UseFormRegisterReturn
}
