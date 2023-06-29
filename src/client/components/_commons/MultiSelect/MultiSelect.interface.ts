
export default interface MultiSelectProps {
  suffixeLibellé: string
  optionsGroupées: MultiSelectOptionsGroupées
  valeursSélectionnéesParDéfaut?: string[];
  changementValeursSélectionnéesCallback: (valeursSélectionnées: string[]) => void
  label: string
}

export type MultiSelectOption = { 
  label: string 
  value: string,
  disabled?: boolean
};

export type MultiSelectOptionGroupée = { 
  label: string,
  options: MultiSelectOptions
};

export type MultiSelectOptions = MultiSelectOption[];
export type MultiSelectOptionsGroupées = MultiSelectOptionGroupée[];
