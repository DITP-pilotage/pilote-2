
export default interface InputGroupeProps {
  optionsGroupées: InputGroupeOptionsGroupées
  valeurSelectionneeParDefaut: string;
  changementValeurSelectionneeCallback: (valeursSélectionnées: string) => void
  label: string,
  libelle: string,
  desactive?: boolean
}

export type InputGroupeOption = {
  label: string 
  value: string,
  disabled?: boolean
  afficherIcone?: boolean
};

export type InputGroupeOptionGroupée = {
  label: string,
  options: InputGroupeOptions
};

export type InputGroupeOptions = InputGroupeOption[];
export type InputGroupeOptionsGroupées = InputGroupeOptionGroupée[];
