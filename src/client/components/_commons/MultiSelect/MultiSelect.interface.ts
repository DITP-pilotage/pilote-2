import { MultiValue } from 'react-select';

export default interface MultiSelectProps {
  libellé: string,
  optionsGroupées: MultiSelectOptionsGroupées
  ouvertureCallback: (estOuvert: boolean) => void
  changementValeursSélectionnéesCallback: (valeursSélectionnées: MultiValue<MultiSelectOption>) => void
  optionsSélectionnéesParDéfaut: MultiValue<MultiSelectOption>
}

export type MultiSelectOption = { 
  label: string 
  value: string,
  estSélectionné: boolean
};

export type MultiSelectOptionGroupée = { 
  label: string,
  options: MultiSelectOptions
};

export type MultiSelectOptions = MultiSelectOption[];
export type MultiSelectOptionsGroupées = MultiSelectOptionGroupée[];
