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
  onValuesChange,
  disabled = false,
  showSearch = true,
  placeholderRecherche = "Rechercher...",
  contentClassName = "max-h-96 overflow-hidden",
  trigger,
}: {
  options: PickerOption<T>[] | PickerOptionGroup<T>[];
  value?: T;
  onValueChange?: (value: T, group?: PickerOptionGroup<T> | null) => void;
  onValuesChange?: (values: T[]) => void;
  disabled?: boolean;
  showSearch?: boolean;
  placeholderRecherche?: string;
  contentClassName?: string;
  trigger: React.ReactNode;
}) => {
  const [recherche, setRecherche] = useState("");
  const [open, setOpen] = useState(false);
  const rechercheRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isGrouped = isGroupedOptions(options);

  const rechercheNormalisee = recherche.toLowerCase();

  const matchesRecherche = (libelle: string) =>
    libelle.toLowerCase().includes(rechercheNormalisee);

  const isVisibleBySearch = (
    option: PickerOption<T>,
    groupMatchesSearch: boolean,
  ) => {
    if (!showSearch || !recherche) return true;
    return groupMatchesSearch || matchesRecherche(option.libelle);
  };

  const hasVisibleResults = showSearch
    ? isGrouped
      ? options.some((group) => {
          const groupMatches = matchesRecherche(group.libelle);
          return (
            groupMatches ||
            group.options.some((option) => matchesRecherche(option.libelle))
          );
        })
      : options.some((option) => matchesRecherche(option.libelle))
    : true;

  return (
    <Select.Root
      open={open}
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
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
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
                const groupMatchesSearch = matchesRecherche(group.libelle);
                const hasMatchingOptions = group.options.some((option) =>
                  matchesRecherche(option.libelle),
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
                      <div className="flex items-center justify-between">
                        <Select.Label>{group.libelle}</Select.Label>
                        {onValuesChange && (
                          <button
                            className="text-xs text-[var(--text-action-high-blue-france)] hover:underline px-2 py-1"
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const visibleValues = group.options
                                .filter(
                                  (option) =>
                                    isVisibleBySearch(
                                      option,
                                      groupMatchesSearch,
                                    ) && !option.desactivee,
                                )
                                .map((option) => option.valeur);
                              if (visibleValues.length > 0) {
                                onValuesChange(visibleValues);
                                setOpen(false);
                              }
                            }}
                            type="button"
                          >
                            Tout sélectionner
                          </button>
                        )}
                      </div>
                      <div className="pl-3">
                        {group.options.map((option) => {
                          const shouldHideOption = !isVisibleBySearch(
                            option,
                            groupMatchesSearch,
                          );

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
                const shouldHideOption = !isVisibleBySearch(option, false);

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
