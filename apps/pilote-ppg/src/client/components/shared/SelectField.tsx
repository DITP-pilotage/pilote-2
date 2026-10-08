import { ReactNode } from "react";
import { Select } from "@/components/shared/Select";
import {
  Picker,
  type PickerOption,
  type PickerOptionGroup,
} from "@/components/shared/Picker";
import { ChampObligatoire } from "@/components/_commons/ChampObligatoire/ChampObligatoire";
import { clsxm } from "@/utils/clsxm";

export type SelectFieldOption<T extends string> = PickerOption<T>;
export type SelectFieldOptionGroup<T extends string> = PickerOptionGroup<T>;

// Radix refuse un Select.Item de valeur vide : l'option « aucune valeur » des
// formulaires circule sous cette valeur sentinelle.
const EMPTY_VALUE = "__empty__";
const SEARCH_THRESHOLD = 10;

const isGrouped = <T extends string>(
  options: SelectFieldOption<T>[] | SelectFieldOptionGroup<T>[],
): options is SelectFieldOptionGroup<T>[] =>
  options.length > 0 && "options" in options[0];

const countOptions = <T extends string>(
  options: SelectFieldOption<T>[] | SelectFieldOptionGroup<T>[],
) =>
  isGrouped(options)
    ? options.reduce((total, group) => total + group.options.length, 0)
    : options.length;

export const SelectField = <T extends string>({
  name,
  options,
  value,
  onChange,
  label,
  hint,
  errorMessage,
  placeholder = "Sélectionner...",
  searchable,
  searchPlaceholder = "Rechercher...",
  disabled = false,
  required = false,
  className,
  triggerClassName,
  contentClassName,
}: {
  name: string;
  options: SelectFieldOption<T>[] | SelectFieldOptionGroup<T>[];
  value?: T;
  onChange?: (value: T, group?: SelectFieldOptionGroup<T> | null) => void;
  label?: ReactNode;
  hint?: ReactNode;
  errorMessage?: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}) => {
  const grouped = isGrouped(options);
  const hasEmptyOption =
    !grouped && options.some((option) => option.valeur === "");

  // Radix affiche le placeholder pour la valeur "" tout en restant contrôlé.
  const toPicker = (raw: T | undefined): T => {
    if (raw === "" && hasEmptyOption) return EMPTY_VALUE as T;
    return (raw ?? "") as T;
  };

  const pickerOptions = grouped
    ? options
    : options.map((option) =>
        option.valeur === "" ? { ...option, valeur: EMPTY_VALUE as T } : option,
      );

  return (
    <div className={clsxm("flex flex-col gap-1", className)}>
      {label ? (
        <label className="fr-label" htmlFor={name}>
          {label}
          {required ? <ChampObligatoire /> : null}
        </label>
      ) : null}
      {hint ? (
        <span className="text-xs leading-5 text-dsfr-mention-grey">{hint}</span>
      ) : null}

      <Picker
        contentClassName={contentClassName}
        disabled={disabled}
        name={name}
        onValueChange={(selected, group) =>
          onChange?.((selected === EMPTY_VALUE ? "" : selected) as T, group)
        }
        options={pickerOptions}
        placeholderRecherche={searchPlaceholder}
        showSearch={searchable ?? countOptions(options) > SEARCH_THRESHOLD}
        trigger={
          <Select.Trigger
            className={clsxm("w-full text-left", triggerClassName, {
              "!border-b-red-500": errorMessage,
            })}
            data-value={value ?? ""}
            id={name}
          >
            <span className="line-clamp-1">
              <Select.Value placeholder={placeholder} />
            </span>
          </Select.Trigger>
        }
        value={toPicker(value)}
      />

      {errorMessage ? (
        <p className="fr-error-text fr-mt-1v">{errorMessage}</p>
      ) : null}
    </div>
  );
};
