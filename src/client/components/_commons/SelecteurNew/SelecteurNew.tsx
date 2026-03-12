import { Select } from "@/components/shared/Select";
import { clsxm } from "@/utils/clsxm";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import {
  Picker,
  type PickerOption,
  type PickerOptionGroup,
} from "@/components/shared/Picker";

export type SelecteurNewOption<T> = PickerOption<T>;
export type SelecteurNewOptionGroup<T extends string> = PickerOptionGroup<T>;

export const SelecteurNew = <T extends string>({
  htmlName,
  options,
  erreurMessage,
  onChange,
  valeurSelectionnee,
  libelle,
  placeholder = "Sélectionner...",
  showSearch = true,
  disabled = false,
  className,
  triggerClassName,
  isRequired,
  placeholderRecherche = "Rechercher...",
}: {
  htmlName: string;
  options: SelecteurNewOption<T>[] | SelecteurNewOptionGroup<T>[];
  erreurMessage?: string;
  onChange?: (valeur: T, group?: SelecteurNewOptionGroup<T> | null) => void;
  valeurSelectionnee?: T;
  libelle?: React.ReactNode;
  placeholder?: string;
  placeholderRecherche?: string;
  showSearch?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  isRequired?: boolean;
}) => {
  return (
    <div className={clsxm("flex flex-col gap-1", className)}>
      {libelle ? (
        <label className="fr-label" htmlFor={htmlName}>
          {libelle}
          {isRequired ? <ChampObligatoire /> : null}
        </label>
      ) : null}

      <Picker
        options={options}
        value={valeurSelectionnee}
        onValueChange={onChange}
        disabled={disabled}
        showSearch={showSearch}
        placeholderRecherche={placeholderRecherche}
        trigger={
          <Select.Trigger
            className={clsxm("w-50 text-left", triggerClassName, {
              "!border-b-red-500": erreurMessage,
            })}
            id={htmlName}
          >
            <span className="line-clamp-1">
              <Select.Value placeholder={placeholder} />
            </span>
          </Select.Trigger>
        }
      />

      {erreurMessage ? (
        <p className="fr-error-text fr-mt-1v">{erreurMessage}</p>
      ) : null}
    </div>
  );
};
