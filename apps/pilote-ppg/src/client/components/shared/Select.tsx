import { Select as SelectPrimitive } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";

export const SELECT_TRIGGER_CLASSES = clsxm(
  "flex items-center justify-between gap-3 px-4 py-1.5 font-medium font-normal border rounded-t border-b-2 border-b-gray-600 bg-dsfr-contrast-grey",
  "data-[state=open]:border-b-primary",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const LINK_BUTTON_TRIGGER_CLASSES =
  "bg-transparent border-none p-0 text-xs cursor-pointer text-primary hover:underline";

export const SELECT_CONTENT_CLASSES = clsxm(
  "bg-white rounded-md shadow-md border border-gray-100 z-50",
  "md:min-w-[400px] max-w-[450px]",
  "data-[state=open]:animate-dropdown-fade-in data-[state=closed]:animate-dropdown-fade-out",
);

export const Select = Object.assign({}, SelectPrimitive, {
  Trigger: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Trigger>) => (
    <SelectPrimitive.Trigger
      className={clsxm(SELECT_TRIGGER_CLASSES, className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icone className="text-current" icone={ArrowSLine2Icon} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
  GhostButtonTrigger: ({
    children,
    className,
    ...props
  }: ComponentProps<typeof SelectPrimitive.Trigger>) => (
    <SelectPrimitive.Trigger
      className={clsxm(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 bg-transparent border-none",
        "hover:bg-gray-100 hover:text-gray-700",
        "data-[state=open]:bg-gray-100",
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
        className={clsxm(SELECT_CONTENT_CLASSES, className)}
        position="popper"
        side="bottom"
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
        "relative flex items-center px-4 py-2 text-sm cursor-pointer select-none outline-none",
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
    <SelectPrimitive.Group className={clsxm("py-2", className)} {...props}>
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
        "px-4 py-1 text-xs font-bold text-dsfr-grey-200 uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Label>
  ),
  Separator: (props: ComponentProps<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
      {...props}
      className={clsxm("h-px bg-dsfr-contrast-grey my-1", props.className)}
    />
  ),
});
