import { Select as SelectPrimitive } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";

export const Select = Object.assign({}, SelectPrimitive, {
  Trigger: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Trigger>) => (
    <SelectPrimitive.Trigger
      className={clsxm(
        "!flex items-center justify-between gap-3 !px-4 !py-1.5 !font-medium !font-normal border !rounded-t !border-b-2 !border-b-gray-600 !bg-dsfr-contrast-grey",
        "data-[state=open]:!border-b-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icone className="text-current" icone={ArrowSLine2Icon} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
  Content: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Content>) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={clsxm(
          "bg-white rounded-md shadow-md border border-gray-100 z-50",
          "data-[state=open]:animate-dropdown-fade-in data-[state=closed]:animate-dropdown-fade-out",
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
  Item: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Item>) => (
    <SelectPrimitive.Item
      className={clsxm(
        "relative flex items-center px-4 py-2 !text-sm cursor-pointer select-none outline-none",
        "data-[highlighted]:bg-dsfr-alt-blue-france",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ),
  Group: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Group>) => (
    <SelectPrimitive.Group className={clsxm("py-1", className)} {...props}>
      {children}
    </SelectPrimitive.Group>
  ),
  Label: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Label>) => (
    <SelectPrimitive.Label
      className={clsxm(
        "px-4 py-1 !text-xs font-bold text-dsfr-mention-grey uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Label>
  ),
  Separator: (props: ComponentProps<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
      className={clsxm("h-px bg-dsfr-mention-grey my-1", props.className)}
      {...props}
    />
  ),
});
