import { Slot } from "radix-ui";
import { ComponentProps, forwardRef, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

// Reproduit le bouton du DSFR (fr-btn) : primaire plein, secondaire bordé,
// tertiaire bordé de gris ou sans bordure, et une variante lien.
export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "tertiary-no-outline" | "link";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-dsfr-blue-france-sun-113-hover disabled:bg-dsfr-grey-925 disabled:text-dsfr-grey-625",
  secondary:
    "bg-transparent text-primary ring-1 ring-inset ring-primary hover:bg-dsfr-grey-1000 disabled:text-dsfr-grey-625 disabled:ring-dsfr-grey-925",
  tertiary:
    "bg-transparent text-primary ring-1 ring-inset ring-dsfr-grey-900 hover:bg-dsfr-grey-1000 disabled:text-dsfr-grey-625",
  "tertiary-no-outline":
    "bg-transparent text-primary hover:bg-dsfr-grey-1000 disabled:text-dsfr-grey-625",
  link: "text-primary bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-bottom bg-no-repeat hover:bg-[length:100%_2px] disabled:bg-[length:100%_1px] disabled:opacity-80",
};

const SIZES = {
  sm: "min-h-8 px-3 py-1 text-sm leading-6",
  md: "min-h-10 px-4 py-2 text-base leading-6",
  lg: "min-h-12 px-6 py-2 text-lg leading-7",
};

export type ButtonSize = keyof typeof SIZES;

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      asChild = false,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    const classes = clsxm(
      "inline-flex items-center gap-2 w-fit font-medium rounded-none border-0 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus",
      variant === "link" ? "p-0 min-h-0 h-6 text-base leading-6" : SIZES[size],
      VARIANTS[variant],
      className,
    );

    if (asChild) {
      return (
        <Slot.Root className={classes} ref={ref} {...props}>
          {children}
        </Slot.Root>
      );
    }

    return (
      <button className={classes} ref={ref} type={type} {...props}>
        {iconLeft}
        {children}
        {iconRight}
      </button>
    );
  },
);
