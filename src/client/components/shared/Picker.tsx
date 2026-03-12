import { useRef, useState } from "react";
import { Select } from "@/components/shared/Select";
import { AnimateEntry } from "@/components/shared/AnimateEntry";

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

function isGroupedOptions<T extends string>(
  options: PickerOption<T>[] | PickerOptionGroup<T>[],
): options is PickerOptionGroup<T>[] {
  if (options.length === 0) return false;
  return "options" in options[0];
}

export const Picker = <T extends string>({
  options,
  value,
  onValueChange,
  disabled = false,
  showSearch = true,
  placeholderRecherche = "Rechercher...",
  contentClassName = "max-h-96 overflow-hidden",
  trigger,
}: {
  options: PickerOption<T>[] | PickerOptionGroup<T>[];
  value?: T;
  onValueChange?: (value: T, group?: PickerOptionGroup<T> | null) => void;
  disabled?: boolean;
  showSearch?: boolean;
  placeholderRecherche?: string;
  contentClassName?: string;
  trigger: React.ReactNode;
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
    <Select.Root
      onValueChange={(val) => {
        if (isGrouped) {
          const group = (options as PickerOptionGroup<T>[]).find((g) =>
            g.options.some((o) => o.valeur === val),
          );
          onValueChange?.(val as T, group || null);
        } else {
          onValueChange?.(val as T, null);
        }
      }}
      value={value}
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
      {trigger}

      <Select.Content className={contentClassName}>
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
            ? (options as PickerOptionGroup<T>[]).map((group, index) => {
                const groupMatchesSearch = group.libelle
                  .toLowerCase()
                  .includes(rechercheNormalisee);
                const hasMatchingOptions = group.options.some((option) =>
                  option.libelle.toLowerCase().includes(rechercheNormalisee),
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
              })
            : (options as PickerOption<T>[]).map((option) => {
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
  );
};
