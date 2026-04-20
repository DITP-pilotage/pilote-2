"use client";

import {
  ComponentType,
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { clsxm } from "@/utils/clsxm";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";

export type CalloutColor =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "blue"
  | "moutarde";

const colorVariants: Record<
  CalloutColor,
  { bg: string; border: string; iconColor: string }
> = {
  info: {
    bg: "bg-dsfr-info-950",
    border: "!border-l-dsfr-info-main-525",
    iconColor: "!text-dsfr-info-main-525",
  },
  success: {
    bg: "bg-dsfr-green-emeraude-975",
    border: "!border-l-dsfr-success-425",
    iconColor: "!text-dsfr-success-425",
  },
  warning: {
    bg: "bg-dsfr-warning-950",
    border: "!border-l-dsfr-warning-425",
    iconColor: "!text-dsfr-warning-425",
  },
  error: {
    bg: "bg-dsfr-warning-950",
    border: "!border-l-dsfr-error-425",
    iconColor: "!text-dsfr-error-425",
  },
  blue: {
    bg: "bg-dsfr-alt-blue-france",
    border: "!border-l-primary",
    iconColor: "!text-primary",
  },
  moutarde: {
    bg: "bg-dsfr-moutarde-main-975",
    border: "!border-l-dsfr-moutarde-main-679",
    iconColor: "!text-dsfr-moutarde-main-679",
  },
};

const CalloutContext = createContext<{ iconColor: string } | null>(null);

interface CalloutRootProps extends HTMLAttributes<HTMLDivElement> {
  color?: CalloutColor;
}

interface CalloutIconProps extends HTMLAttributes<HTMLDivElement> {
  icone?: ComponentType<{ className: string; fill: string }> | ReactNode;
}

const CalloutRoot = ({
  children,
  color = "info",
  className,
  ...props
}: CalloutRootProps) => {
  const variant = colorVariants[color];

  const variantIconColor = useMemo(() => {
    return { iconColor: variant.iconColor };
  }, [variant.iconColor]);

  return (
    <CalloutContext.Provider value={variantIconColor}>
      <div
        {...props}
        className={clsxm(
          "!border-l-4 p-4 flex gap-3 items-start",
          variant.bg,
          variant.border,
          className,
        )}
      >
        {children}
      </div>
    </CalloutContext.Provider>
  );
};

const CalloutIcon = ({
  icone = InformationPleineIcon,
  className,
  ...props
}: CalloutIconProps) => {
  const context = useContext(CalloutContext);
  const isComponent = typeof icone === "function";

  return (
    <div
      {...props}
      className={clsxm("flex-shrink-0 mt-1", context?.iconColor, className)}
    >
      {isComponent
        ? (() => {
            const IconComponent = icone as ComponentType<{
              className: string;
              fill: string;
            }>;
            return <IconComponent className="w-5 h-5" fill="currentColor" />;
          })()
        : icone}
    </div>
  );
};

const CalloutText = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={clsxm("text-sm leading-relaxed flex-1", className)}
  >
    {children}
  </div>
);

export const Callout = {
  Root: CalloutRoot,
  Icon: CalloutIcon,
  Text: CalloutText,
};
