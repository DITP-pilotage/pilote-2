"use client";

import { ToggleGroup } from "radix-ui";
import {
  ButtonHTMLAttributes,
  ComponentProps,
  ComponentType,
  ReactNode,
} from "react";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";

// Reproduit le composant « Tag » du DSFR (pastille arrondie bleu clair).
export type TagVariant = "default" | "active" | "warning" | "info" | "mustard";

const COLORS: Record<TagVariant, string> = {
  default:
    "bg-dsfr-blue-france-925 text-dsfr-blue-france-sun-113 hover:bg-dsfr-blue-france-925-hover",
  active: "bg-primary text-white hover:bg-dsfr-blue-france-sun-113-hover",
  warning: "bg-dsfr-warning-425 text-white",
  info: "bg-dsfr-info-main-525 text-white",
  mustard: "bg-dsfr-moutarde-main-850 text-black",
};

const SIZES = {
  md: { tag: "min-h-8 px-3 py-1 text-sm leading-6", icon: "w-4 h-4" },
  sm: { tag: "min-h-6 px-2 py-0.5 text-xs leading-5", icon: "w-3 h-3" },
};

const TAG_CLASSES =
  "inline-flex items-center justify-center gap-1 w-fit max-w-full min-w-9 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

type Size = keyof typeof SIZES;
type TagIcon = ComponentType<{ className: string; fill: string }>;

export const Tag = ({
  variant = "default",
  size = "md",
  iconLeft,
  iconRight,
  truncate = false,
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: TagVariant;
  size?: Size;
  iconLeft?: TagIcon;
  iconRight?: TagIcon;
  truncate?: boolean;
  children: ReactNode;
}) => (
  <button
    {...props}
    className={clsxm(TAG_CLASSES, SIZES[size].tag, COLORS[variant], className)}
    type="button"
  >
    {iconLeft ? (
      <Icone
        className={clsxm(SIZES[size].icon, "text-current")}
        icone={iconLeft}
      />
    ) : null}
    <span className={clsxm(truncate && "max-w-[30ch] truncate")}>
      {children}
    </span>
    {iconRight ? (
      <Icone
        className={clsxm(SIZES[size].icon, "text-current")}
        icone={iconRight}
      />
    ) : null}
  </button>
);

// Groupe de tags à choix unique : un choix reste toujours sélectionné.
export const TagToggleGroup = {
  Root: ({
    value,
    onValueChange,
    className,
    children,
    ...props
  }: Omit<
    ComponentProps<typeof ToggleGroup.Root>,
    "type" | "value" | "defaultValue" | "onValueChange"
  > & {
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <ToggleGroup.Root
      {...props}
      className={clsxm("flex flex-wrap items-center gap-2", className)}
      onValueChange={(value) => {
        if (value) onValueChange(value);
      }}
      type="single"
      value={value}
    >
      {children}
    </ToggleGroup.Root>
  ),
  Item: ({
    size = "md",
    className,
    children,
    ...props
  }: ComponentProps<typeof ToggleGroup.Item> & { size?: Size }) => (
    <ToggleGroup.Item
      {...props}
      className={clsxm(
        TAG_CLASSES,
        SIZES[size].tag,
        COLORS.default,
        "data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:cursor-default",
        className,
      )}
    >
      {children}
    </ToggleGroup.Item>
  ),
};
