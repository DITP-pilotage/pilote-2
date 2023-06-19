import { HTMLInputTypeAttribute } from 'react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

export default interface InputAvecLabelProps {
  type?: HTMLInputTypeAttribute,
  libellé: string,
  htmlName: string,
  texteAide?: string,
  erreur?:  FieldError
  register: UseFormRegisterReturn
}
