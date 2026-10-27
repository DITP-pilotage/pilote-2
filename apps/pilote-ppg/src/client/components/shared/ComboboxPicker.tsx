import { Command } from "cmdk";
import { Popover } from "radix-ui";
import { Fragment, useId, useState } from "react";
import { SELECT_CONTENT_CLASSES } from "@/components/shared/Select";
import {
  isGroupedOptions,
  type PickerOption,
  type PickerOptionGroup,
  type PickerProps,
} from "@/components/shared/pickerTypes";
import rechercheUnTexteContenuDansUnContenant from "@/client/utils/rechercheUnTexteContenuDansUnContenant";
import { clsxm } from "@/utils/clsxm";

export const ComboboxPicker = <T extends string>({
  name,
  appearance = "default",
  options,
  value,
  onValueChange,
  onValuesChange,
  disabled = false,
  invalid = false,
  placeholderRecherche = "Rechercher...",
  contentClassName = "max-h-96 overflow-hidden",
  trigger,
}: PickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const contentId = useId();
  const striped = appearance === "striped";

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const matches = (libelle: string) =>
    rechercheUnTexteContenuDansUnContenant(search, libelle);

  const visibleOptions = (
    candidates: PickerOption<T>[],
    groupLibelle?: string,
  ) =>
    groupLibelle && matches(groupLibelle)
      ? candidates
      : candidates.filter((option) => matches(option.libelle));

  const visibleGroups = isGroupedOptions(options)
    ? options
        .map((group) => ({
          ...group,
          options: visibleOptions(group.options, group.libelle),
        }))
        .filter((group) => group.options.length > 0)
    : [];
  const visibleUngroupedOptions = isGroupedOptions(options)
    ? []
    : visibleOptions(options);

  const resultCount =
    visibleUngroupedOptions.length +
    visibleGroups.reduce((total, group) => total + group.options.length, 0);
  const resultAnnouncement =
    resultCount > 0
      ? `${resultCount} résultat${resultCount > 1 ? "s" : ""}`
      : "Aucun résultat";

  const select = (option: PickerOption<T>) => {
    if (option.valeur !== value) {
      const group = isGroupedOptions(options)
        ? options.find((candidate) =>
            candidate.options.some(
              (groupOption) => groupOption.valeur === option.valeur,
            ),
          )
        : undefined;
      onValueChange?.(option.valeur, group ?? null);
    }
    changeOpen(false);
  };

  const selectAll = (group: PickerOptionGroup<T>) => {
    const values = group.options
      .filter((option) => !option.desactivee)
      .map((option) => option.valeur);
    if (values.length > 0) {
      onValuesChange?.(values);
      changeOpen(false);
    }
  };

  const renderItem = (option: PickerOption<T>) => (
    <Command.Item
      className={clsxm(
        "relative flex items-center px-4 py-2 text-sm cursor-pointer select-none outline-none",
        "data-[selected=true]:bg-dsfr-alt-blue-france",
        "data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none",
        striped && [
          "px-4 py-3 text-base odd:bg-dsfr-grey-1000 even:bg-dsfr-grey-950",
          "data-[selected=true]:bg-dsfr-grey-925",
          "data-[checked=true]:text-dsfr-mention-grey data-[checked=true]:cursor-not-allowed",
          "data-[checked=true]:data-[selected=true]:odd:bg-dsfr-grey-1000 data-[checked=true]:data-[selected=true]:even:bg-dsfr-grey-950",
        ],
      )}
      data-checked={option.valeur === value}
      data-value={option.valeur}
      disabled={option.desactivee}
      key={String(option.valeur)}
      onSelect={() => select(option)}
      value={option.valeur}
    >
      {option.libelle}
    </Command.Item>
  );

  return (
    <>
      {/* Contrairement au Radix Select, le Popover ne rend aucun champ natif :
          sans cet input, la valeur n'est pas soumise avec le formulaire. */}
      {name ? <input name={name} type="hidden" value={value ?? ""} /> : null}
      <Popover.Root modal onOpenChange={changeOpen} open={open}>
        <Popover.Trigger
          aria-controls={contentId}
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          asChild
          disabled={disabled}
          role="combobox"
        >
          {trigger}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            aria-label={placeholderRecherche}
            className={clsxm(SELECT_CONTENT_CLASSES, contentClassName)}
            id={contentId}
            side="bottom"
            sideOffset={4}
          >
            <Command
              defaultValue={value}
              label={placeholderRecherche}
              shouldFilter={false}
            >
              <div className={clsxm("px-4 pb-2 pt-1", striped && "pt-3")}>
                <Command.Input
                  className={
                    striped
                      ? "w-full px-4 py-2 border-0 border-b-2 border-solid border-dsfr-grey-200 text-base bg-dsfr-grey-950 placeholder:italic placeholder:text-dsfr-mention-grey"
                      : "w-full px-3 py-2 border-b-2 border-primary text-sm bg-dsfr-alt-blue-france placeholder-dsfr-mention-grey placeholder:italic"
                  }
                  onValueChange={setSearch}
                  placeholder={placeholderRecherche}
                  value={search}
                />
              </div>
              <Command.List
                className={clsxm(
                  "overflow-y-auto",
                  striped ? "max-h-80" : "max-h-[19rem] p-1",
                )}
              >
                <Command.Empty className="px-4 py-2 text-sm text-dsfr-mention-grey text-center">
                  Aucun résultat
                </Command.Empty>
                {visibleUngroupedOptions.map(renderItem)}
                {visibleGroups.map((group, index) => (
                  <Fragment key={String(group.valeur)}>
                    {index > 0 && (
                      <Command.Separator
                        alwaysRender
                        className={clsxm(
                          "h-px bg-dsfr-contrast-grey my-1",
                          striped && "my-0 bg-dsfr-grey-200",
                        )}
                      />
                    )}
                    <div className="relative">
                      <Command.Group
                        className={clsxm(
                          "py-2 [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:text-dsfr-grey-200 [&_[cmdk-group-heading]]:uppercase",
                          !striped && "[&_[cmdk-group-items]]:pl-3",
                          striped &&
                            "py-0 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-base [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-dsfr-mention-grey",
                        )}
                        heading={group.libelle || undefined}
                        value={group.valeur}
                      >
                        {group.options.map(renderItem)}
                      </Command.Group>
                      {onValuesChange && (
                        <button
                          className="absolute right-0 top-2 text-xs text-primary hover:underline px-2 py-1"
                          onClick={() => selectAll(group)}
                          type="button"
                        >
                          Tout sélectionner
                        </button>
                      )}
                    </div>
                  </Fragment>
                ))}
              </Command.List>
            </Command>
            <p aria-live="polite" className="sr-only">
              {resultAnnouncement}
            </p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
};
