import { useRef, useState } from "react";
import { Select } from "@/components/shared/Select";
import { clsxm } from "@/utils/clsxm";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import { AnimateEntry } from "@/components/shared/AnimateEntry";

export type SelecteurNewOption<T> = {
  libelle: string;
  valeur: T;
  desactivee?: boolean;
};

export type SelecteurNewOptionGroup<T extends string> = {
  libelle: string;
  valeur: T;
  options: SelecteurNewOption<T>[];
};

function isGroupedOptions<T extends string>(
  options: SelecteurNewOption<T>[] | SelecteurNewOptionGroup<T>[],
): options is SelecteurNewOptionGroup<T>[] {
  if (options.length === 0) return false;
  return "options" in options[0];
}

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
  const [recherche, setRecherche] = useState("");
  const rechercheRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isGrouped = isGroupedOptions(options);

  const rechercheNormalisee = recherche.toLowerCase();

  const hasVisibleResults = showSearch
    ? isGrouped
      ? options.some((group) => {
          const groupMatchesSearch = group.libelle
            .toLowerCase()
            .includes(rechercheNormalisee);
          return (
            groupMatchesSearch ||
            group.options.some((option) =>
              option.libelle.toLowerCase().includes(rechercheNormalisee),
            )
          );
        })
      : options.some((option) =>
          option.libelle.toLowerCase().includes(rechercheNormalisee),
        )
    : true;

  return (
    <div className={clsxm("flex flex-col gap-1", className)}>
      {libelle ? (
        <label className="fr-label" htmlFor={htmlName}>
          {libelle}
          {isRequired ? <ChampObligatoire /> : null}
        </label>
      ) : null}

      <Select.Root
        onValueChange={(value) => {
          if (isGrouped) {
            const group = (options as SelecteurNewOptionGroup<T>[]).find((g) =>
              g.options.some((o) => o.valeur === value),
            );
            onChange?.(value as T, group || null);
          } else {
            onChange?.(value as T, null);
          }
        }}
        value={valeurSelectionnee}
        disabled={disabled}
        onOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              rechercheRef.current?.focus();
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
              }
            }, 0);
          } else {
            setRecherche("");
          }
        }}
      >
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

        <Select.Content className="max-h-96 overflow-hidden !w-[var(--radix-select-trigger-width)]">
          {showSearch ? (
            <div className="sticky top-0 bg-white z-10 px-4 pb-2 pt-1">
              <input
                aria-label="Rechercher"
                className="w-full !px-3 !py-2 !border-b-2 !border-primary !text-sm !bg-dsfr-alt-blue-france !placeholder-dsfr-mention-grey placeholder:italic"
                onChange={(event) => {
                  setRecherche(event.target.value);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                  }
                }}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder={placeholderRecherche}
                type="text"
                value={recherche}
                ref={rechercheRef}
              />
            </div>
          ) : null}

          <div ref={scrollContainerRef} className="max-h-80 overflow-y-auto">
            {!hasVisibleResults && (
              <div className="px-4 py-2 text-sm text-dsfr-mention-grey text-center">
                Aucun résultat
              </div>
            )}
            {isGrouped
              ? (options as SelecteurNewOptionGroup<T>[]).map(
                  (group, index) => {
                    const groupMatchesSearch = group.libelle
                      .toLowerCase()
                      .includes(rechercheNormalisee);
                    const hasMatchingOptions = group.options.some((option) =>
                      option.libelle
                        .toLowerCase()
                        .includes(rechercheNormalisee),
                    );
                    const shouldHideGroup =
                      showSearch &&
                      recherche &&
                      !groupMatchesSearch &&
                      !hasMatchingOptions;

                    return (
                      <AnimateEntry
                        key={String(group.valeur)}
                        visible={!shouldHideGroup}
                      >
                        {index > 0 && <Select.Separator />}
                        <Select.Group>
                          <Select.Label>{group.libelle}</Select.Label>
                          <div className="pl-3">
                            {group.options.map((option) => {
                              const shouldHideOption =
                                showSearch &&
                                recherche &&
                                !groupMatchesSearch &&
                                !option.libelle
                                  .toLowerCase()
                                  .includes(rechercheNormalisee);

                              return (
                                <AnimateEntry
                                  key={String(option.valeur)}
                                  visible={!shouldHideOption}
                                >
                                  <Select.Item
                                    disabled={option.desactivee}
                                    value={option.valeur}
                                  >
                                    {option.libelle}
                                  </Select.Item>
                                </AnimateEntry>
                              );
                            })}
                          </div>
                        </Select.Group>
                      </AnimateEntry>
                    );
                  },
                )
              : (options as SelecteurNewOption<T>[]).map((option) => {
                  const shouldHideOption =
                    showSearch &&
                    recherche &&
                    !option.libelle.toLowerCase().includes(rechercheNormalisee);

                  return (
                    <AnimateEntry
                      key={String(option.valeur)}
                      visible={!shouldHideOption}
                    >
                      <Select.Item
                        disabled={option.desactivee}
                        value={option.valeur}
                      >
                        {option.libelle}
                      </Select.Item>
                    </AnimateEntry>
                  );
                })}
          </div>
        </Select.Content>
      </Select.Root>

      {erreurMessage ? (
        <p className="fr-error-text fr-mt-1v">{erreurMessage}</p>
      ) : null}
    </div>
  );
};
