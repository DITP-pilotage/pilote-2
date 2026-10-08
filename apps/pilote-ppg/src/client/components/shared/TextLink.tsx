import { Slot } from "radix-ui";
import { ComponentProps, forwardRef } from "react";
import { clsxm } from "@/utils/clsxm";

// Reproduit le lien du DSFR (fr-link) : souligné fin, épaissi au survol, masqué à l'impression.
type TextLinkSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<TextLinkSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

type TextLinkProps = ComponentProps<"a"> & {
  size?: TextLinkSize;
  asChild?: boolean;
};

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
  function TextLink(
    { size = "md", asChild = false, className, ...props },
    ref,
  ) {
    const Component = asChild ? Slot.Root : "a";

    return (
      <Component
        className={clsxm(
          "inline bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-bottom bg-no-repeat text-dsfr-blue-france-sun-113 hover:bg-[length:100%_2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus print:hidden",
          SIZES[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
