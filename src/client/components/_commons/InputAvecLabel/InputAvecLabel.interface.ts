import { Field, FieldError, UseFormRegister } from 'react-hook-form';
import { HTMLInputTypeAttribute } from 'react';

export default interface InputAvecLabelProps {
  type?: HTMLInputTypeAttribute,
  libellé: string,
  htmlName: string,
  texteAide?: string,
  erreur?: FieldError
  register: UseFormRegister<Field>
}
