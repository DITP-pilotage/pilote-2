import { Command } from "cmdk";
import { Popover } from "radix-ui";
import { ReactNode, useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { LoupeContourIcon } from "@/components/_commons/Icones/LoupeContourIcon";
import { clsxm } from "@/utils/clsxm";

type SearchPickerProps<T> = {
  items: T[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isItemDisabled?: (item: T) => boolean;
  isLoading?: boolean;
  triggerLabel: ReactNode;
  searchPlaceholder?: string;
  emptyLabel?: string;
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

export const SearchPicker = <T,>({
  items,
  search,
  onSearchChange,
  onSelect,
  getKey,
  renderItem,
  isItemDisabled,
  isLoading = false,
  triggerLabel,
  searchPlaceholder = "Rechercher…",
  emptyLabel = "Aucun résultat",
}: SearchPickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const annonceResultats =
    items.length > 0
      ? `${items.length} résultat${items.length > 1 ? "s" : ""}`
      : emptyLabel;

  const changerOuverture = (next: boolean) => {
    setOpen(next);
    if (!next) onSearchChange("");
  };

  return (
    <Popover.Root onOpenChange={changerOuverture} open={open}>
      <Popover.Trigger
        className={clsxm(
          "flex w-full items-center gap-2 rounded-t px-4 py-2 text-left text-base leading-6",
          "bg-dsfr-grey-950 text-dsfr-mention-grey border-0 border-b-2 border-solid border-primary",
          FOCUS,
        )}
      >
        <Icone
          className="w-5 h-5 shrink-0 text-primary"
          icone={LoupeContourIcon}
        />
        <span className="truncate">{triggerLabel}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label={searchPlaceholder}
          align="start"
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-80 bg-white border border-solid border-dsfr-grey-900 shadow-lg"
          sideOffset={4}
        >
          <Command label={searchPlaceholder} shouldFilter={false}>
            <Command.Input
              className="w-full px-4 py-2 text-base leading-6 border-0 border-b border-solid border-dsfr-grey-900 outline-none placeholder:italic placeholder:text-dsfr-mention-grey"
              onValueChange={onSearchChange}
              placeholder={searchPlaceholder}
              value={search}
            />
            <Command.List className="max-h-80 overflow-y-auto p-1">
              {isLoading ? (
                <Command.Loading>
                  <p className="px-3 py-4 text-sm text-dsfr-mention-grey mb-0">
                    Recherche…
                  </p>
                </Command.Loading>
              ) : (
                <Command.Empty className="px-3 py-4 text-sm text-dsfr-mention-grey">
                  {emptyLabel}
                </Command.Empty>
              )}
              {items.map((item) => (
                <Command.Item
                  className={clsxm(
                    "flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm outline-none",
                    "data-[selected=true]:bg-dsfr-alt-blue-france",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60",
                  )}
                  disabled={isItemDisabled?.(item)}
                  key={getKey(item)}
                  onSelect={() => {
                    onSelect(item);
                    changerOuverture(false);
                  }}
                  value={getKey(item)}
                >
                  {renderItem(item)}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
          <p aria-live="polite" className="sr-only">
            {isLoading ? "" : annonceResultats}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
