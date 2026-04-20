import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { Dropdown } from "@/components/shared/Dropdown";
import { Checkbox } from "@/components/shared/Checkbox";
import { clsxm } from "@/utils/clsxm";

type OptionGroup = {
  label: string;
  options: string[];
};

export const MultiSelectFiltre = ({
  label,
  values,
  optionGroups,
  onChange,
  suffixLabel,
  className,
  getOptionLabel,
  getPlaceholder: getPlaceholderProp,
  showGroupSelection = true,
  showSearch = true,
  classNameBouton,
}: {
  label?: string;
  values: string[];
  optionGroups: OptionGroup[];
  onChange(values: string[]): void;
  suffixLabel?: string;
  className?: string;
  getOptionLabel?(value: string): string;
  getPlaceholder?(values: string[]): string;
  showGroupSelection?: boolean;
  showSearch?: boolean;
  classNameBouton?: string;
}) => {
  const [recherche, setRecherche] = useState("");

  const groupesOptionsFiltres = showSearch
    ? optionGroups
        .map((group) => ({
          ...group,
          options: group.options.filter((valeurOption) => {
            const labelOption = getOptionLabel
              ? getOptionLabel(valeurOption)
              : valeurOption;
            return labelOption.toLowerCase().includes(recherche.toLowerCase());
          }),
        }))
        .filter((group) => group.options.length > 0)
    : optionGroups;

  const toutesLesOptions = optionGroups.flatMap((group) => group.options);
  const toutSelectionne = values.length === toutesLesOptions.length;

  const getPlaceholder = (): string => {
    if (getPlaceholderProp) {
      return getPlaceholderProp(values);
    }
    if (values.length === 0) {
      return "Aucune sélection";
    }
    if (suffixLabel) {
      return `${values.length} ${suffixLabel}`;
    }
    return `${values.length} sélectionné(s)`;
  };

  return (
    <div
      className={clsxm("flex gap-2 !text-sm !w-full items-center", className)}
    >
      {label ? (
        <div className="font-semibold whitespace-nowrap">{label} :</div>
      ) : null}
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button
            className={clsxm(
              "!flex items-center justify-between gap-3 !px-4 !py-1.5 !font-medium border !rounded-t !border-b-2 !border-b-gray-600 !bg-dsfr-contrast-grey",
              classNameBouton,
            )}
            type="button"
          >
            {getPlaceholder()}
            <Icone className="text-current" icone={ArrowSLine2Icon} />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Content
          align="start"
          className="!w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <div className="divide-y divide-dsfr-mention-grey -m-4 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white z-10">
              <Bouton
                className="w-full"
                label={
                  toutSelectionne ? "Tout désélectionner" : "Tout sélectionner"
                }
                onClick={() => {
                  if (toutSelectionne) {
                    onChange([]);
                  } else {
                    onChange(toutesLesOptions);
                  }
                }}
                size="sm"
                variant="link"
              />
              {showSearch ? (
                <div className="px-4 pb-2 pt-1">
                  <input
                    aria-label="Rechercher"
                    className="w-full !px-3 !py-2 !border-b-2 !border-primary !text-sm !bg-dsfr-alt-blue-france !placeholder-dsfr-mention-grey placeholder:italic"
                    onChange={(event) => setRecherche(event.target.value)}
                    placeholder="Rechercher"
                    type="text"
                    value={recherche}
                  />
                </div>
              ) : null}
            </div>
            {groupesOptionsFiltres
              .filter((group) => group.options.length > 0)
              .map((group) => {
                const groupValues = group.options;
                const allGroupSelected = groupValues.every((value) =>
                  values.includes(value),
                );
                const someGroupSelected =
                  groupValues.some((value) => values.includes(value)) &&
                  !allGroupSelected;

                return (
                  <div key={group.label}>
                    {showGroupSelection ? (
                      <div className="px-4 py-2 flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={allGroupSelected}
                          className={someGroupSelected ? "opacity-50" : ""}
                          onCheckedChange={() => {
                            if (allGroupSelected) {
                              onChange(
                                values.filter(
                                  (value) => !groupValues.includes(value),
                                ),
                              );
                            } else {
                              const newValues = [
                                ...values,
                                ...groupValues.filter(
                                  (value) => !values.includes(value),
                                ),
                              ];
                              onChange(newValues);
                            }
                          }}
                        />
                        <span className="font-bold text-sm">{group.label}</span>
                      </div>
                    ) : (
                      <div className="uppercase text-dsfr-mention-grey px-4 py-1 pt-2">
                        {group.label}
                      </div>
                    )}
                    <ul className="!p-0 !m-0">
                      {group.options.map((optionValue) => {
                        const checked = values.includes(optionValue);
                        return (
                          <li
                            className="!list-none block !py-1 bg-dsfr-grey-925 even:bg-dsfr-grey-1000 !px-4"
                            key={optionValue}
                          >
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => {
                                  if (checked) {
                                    onChange(
                                      values.filter(
                                        (value) => value !== optionValue,
                                      ),
                                    );
                                  } else {
                                    onChange([...values, optionValue]);
                                  }
                                }}
                              />
                              {getOptionLabel
                                ? getOptionLabel(optionValue)
                                : optionValue}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
          </div>
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
  );
};
