"use client";

import { Accordion as RadixAccordion } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import "./accordion.css";

// Source unique des classes : la NodeView de l'editeur les redeclarait et le
// contenu avait fini decale de 8px par rapport a son en-tete.
export const CLASSES_ENTETE_ACCORDEON =
  "flex !mb-0 !bg-dsfr-blue-france-925 border-t !border-t-primary";

export const CLASSES_DECLENCHEUR_ACCORDEON = clsxm(
  "flex flex-1 items-center justify-between !p-4 font-medium !text-base text-left !mb-0",
  "hover:!bg-dsfr-blue-france-925-hover transition-colors",
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
);

export const CLASSES_CONTENU_ACCORDEON = "!bg-dsfr-alt-blue-france px-4 py-3";

// Rendu de l'accordéon standard du DSFR : transparent et texte bleu une fois
// fermé, fond bleu clair une fois ouvert.
export const CLASSES_ITEM_ACCORDEON_DSFR =
  "border-b-0 border-t border-dsfr-grey-900 last:border-b";

export const CLASSES_ENTETE_ACCORDEON_DSFR = "!bg-transparent border-t-0";

export const CLASSES_CONTENU_ACCORDEON_DSFR = "!bg-transparent";

export const CLASSES_INTERIEUR_ACCORDEON_DSFR = "pt-4 pb-6";

export const CLASSES_DECLENCHEUR_ACCORDEON_DSFR =
  "!py-3 !text-primary hover:!bg-dsfr-grey-1000 data-[state=open]:!bg-dsfr-blue-france-925 data-[state=open]:hover:!bg-dsfr-blue-france-925-hover";

export const Accordion = Object.assign({}, RadixAccordion, {
  Item: ({
    children,
    ...props
  }: ComponentProps<typeof RadixAccordion.Item>) => (
    <RadixAccordion.Item
      {...props}
      className={clsxm(
        "border-b border-gray-200 last:border-b-0",
        props.className,
      )}
    >
      {children}
    </RadixAccordion.Item>
  ),
  Header: ({
    children,
    ...props
  }: ComponentProps<typeof RadixAccordion.Header>) => (
    <RadixAccordion.Header
      {...props}
      className={clsxm(CLASSES_ENTETE_ACCORDEON, props.className)}
    >
      {children}
    </RadixAccordion.Header>
  ),
  Trigger: ({
    children,
    ...props
  }: ComponentProps<typeof RadixAccordion.Trigger>) => (
    <RadixAccordion.Trigger
      {...props}
      className={clsxm(CLASSES_DECLENCHEUR_ACCORDEON, "group", props.className)}
    >
      {children}
      <Icone
        className="w-5 h-5 text-current transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"
        icone={ArrowSLine2Icon}
      />
    </RadixAccordion.Trigger>
  ),
  Content: ({
    children,
    innerClassName,
    ...props
  }: ComponentProps<typeof RadixAccordion.Content> & {
    innerClassName?: string;
  }) => (
    <RadixAccordion.Content
      {...props}
      className={clsxm(
        "!bg-dsfr-alt-blue-france overflow-hidden accordion-content",
        props.className,
      )}
    >
      <div className={clsxm("flow-root px-4 py-3", innerClassName)}>
        {children}
      </div>
    </RadixAccordion.Content>
  ),
});
