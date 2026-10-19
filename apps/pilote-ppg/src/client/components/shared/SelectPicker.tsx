import { Select as SelectPrimitive } from "radix-ui";
import { useState } from "react";
import { Select } from "@/components/shared/Select";
import {
  isGroupedOptions,
  type PickerOption,
  type PickerProps,
} from "@/components/shared/pickerTypes";
import { clsxm } from "@/utils/clsxm";

export const SelectPicker = <T extends string>({
  name,
  appearance = "default",
  options,
  value,
  onValueChange,
  onValuesChange,
  disabled = false,
  invalid = false,
  contentClassName = "max-h-96 overflow-hidden",
  trigger,
}: PickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const striped = appearance === "striped";
  const stripedItemClassName = (index: number) =>
    striped
      ? clsxm(
          "px-4 py-3 text-base data-[highlighted]:bg-dsfr-grey-925 data-[state=checked]:text-dsfr-mention-grey data-[state=checked]:cursor-not-allowed",
          index % 2 === 0
            ? "bg-dsfr-grey-1000 data-[state=checked]:data-[highlighted]:bg-dsfr-grey-1000"
            : "bg-dsfr-grey-950 data-[state=checked]:data-[highlighted]:bg-dsfr-grey-950",
        )
      : undefined;

  const renderItem = (option: PickerOption<T>, index: number) => (
    <Select.Item
      className={stripedItemClassName(index)}
      data-value={option.valeur}
      disabled={option.desactivee}
      key={String(option.valeur)}
      value={option.valeur}
    >
      {option.libelle}
    </Select.Item>
  );

  return (
    <Select.Root
      disabled={disabled}
      name={name}
      onOpenChange={setOpen}
      onValueChange={(selected) => {
        const group = isGroupedOptions(options)
          ? options.find((candidate) =>
              candidate.options.some((option) => option.valeur === selected),
            )
          : undefined;
        onValueChange?.(selected as T, group ?? null);
      }}
      open={open}
      value={value}
    >
      <SelectPrimitive.Trigger aria-invalid={invalid || undefined} asChild>
        {trigger}
      </SelectPrimitive.Trigger>

      <Select.Content className={contentClassName}>
        <div className="max-h-80 overflow-y-auto">
          {isGroupedOptions(options)
            ? options.map((group, index) => (
                <div key={String(group.valeur)}>
                  {index > 0 && (
                    <Select.Separator
                      className={clsxm(striped && "my-0 bg-dsfr-grey-200")}
                    />
                  )}
                  <Select.Group className={clsxm(striped && "py-0")}>
                    <div className="flex items-center justify-between">
                      {group.libelle ? (
                        <Select.Label
                          className={clsxm(
                            striped &&
                              "py-2 text-base font-normal text-dsfr-mention-grey",
                          )}
                        >
                          {group.libelle}
                        </Select.Label>
                      ) : null}
                      {onValuesChange && (
                        <button
                          className="text-xs text-primary hover:underline px-2 py-1"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const values = group.options
                              .filter((option) => !option.desactivee)
                              .map((option) => option.valeur);
                            if (values.length > 0) {
                              onValuesChange(values);
                              setOpen(false);
                            }
                          }}
                          type="button"
                        >
                          Tout sélectionner
                        </button>
                      )}
                    </div>
                    <div className={clsxm(!striped && "pl-3")}>
                      {group.options.map(renderItem)}
                    </div>
                  </Select.Group>
                </div>
              ))
            : options.map(renderItem)}
        </div>
      </Select.Content>
    </Select.Root>
  );
};
