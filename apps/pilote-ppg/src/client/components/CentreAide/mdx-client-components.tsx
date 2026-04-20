"use client";

import { ComponentType, HTMLAttributes } from "react";
import { Accordion as _Accordion } from "@/client/components/shared/Accordion";
import { Callout as _Callout } from "@/client/components/shared/Callout";
import { Icone as _Icone } from "@/components/_commons/Icone";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";

type IconComponent = ComponentType<{ className: string; fill: string }>;

const calloutIconMap: Record<string, IconComponent> = {
  warning: WarningIcon,
};

const iconeIconMap: Record<string, IconComponent> = {
  arrowLine1: ArrowLine1Icon,
};

export const CalloutRoot = _Callout.Root;

export const CalloutIcon = ({
  type,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  type?: string;
  icone?: IconComponent;
}) => (
  <_Callout.Icon
    {...props}
    icone={(type ? calloutIconMap[type] : props.icone) ?? InformationPleineIcon}
  />
);

export const CalloutText = _Callout.Text;

export const Icone = ({
  type,
  icone,
  className,
}: {
  type?: string;
  icone?: IconComponent;
  className?: string;
}) => {
  const resolved = type ? iconeIconMap[type] : icone;
  if (!resolved) return null;
  return <_Icone icone={resolved} className={className} />;
};

export { Badge } from "@/components/_commons/Badge";

export const AccordionRoot = _Accordion.Root;
export const AccordionItem = _Accordion.Item;
export const AccordionHeader = _Accordion.Header;
export const AccordionTrigger = _Accordion.Trigger;
export const AccordionContent = _Accordion.Content;
