import { ReactElement } from "react";

export type PickerOption<T> = {
  libelle: string;
  valeur: T;
  desactivee?: boolean;
};

export type PickerOptionGroup<T extends string> = {
  libelle: string;
  valeur: T;
  options: PickerOption<T>[];
};

// « striped » reproduit l'ancienne liste DSFR du sélecteur de territoire :
// lignes zébrées sans retrait, titres de groupe gris, recherche grise.
export type PickerAppearance = "default" | "striped";

export type PickerProps<T extends string> = {
  name?: string;
  appearance?: PickerAppearance;
  options: PickerOption<T>[] | PickerOptionGroup<T>[];
  value?: T;
  onValueChange?: (value: T, group?: PickerOptionGroup<T> | null) => void;
  onValuesChange?: (values: T[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholderRecherche?: string;
  contentClassName?: string;
  // Bouton simple : chaque implémentation l'enveloppe avec son propre Trigger.
  trigger: ReactElement;
};

export function isGroupedOptions<T extends string>(
  options: PickerOption<T>[] | PickerOptionGroup<T>[],
): options is PickerOptionGroup<T>[] {
  if (options.length === 0) return false;
  return "options" in options[0];
}
