import { HTMLInputTypeAttribute } from 'react';
import { FieldError, FieldErrorsImpl, Merge, UseFormRegisterReturn } from 'react-hook-form';

export default interface InputProps {
  type?: HTMLInputTypeAttribute,
  libellé: string,
  htmlName: string,
  texteAide?: string,
  erreur?:  FieldError | Merge<FieldError, FieldErrorsImpl<any>>
  register: UseFormRegisterReturn
  disabled?: boolean
}
