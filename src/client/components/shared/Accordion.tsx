"use client";

import { Accordion as RadixAccordion } from "radix-ui";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import "./accordion.css";

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
      className={clsxm(
        "flex !mb-0 !bg-dsfr-blue-france-925 border-t !border-t-primary",
        props.className,
      )}
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
      className={clsxm(
        "flex flex-1 items-center justify-between !p-4 font-medium !text-base text-left !mb-0",
        "hover:!bg-dsfr-blue-france-925-hover transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
        "group",
        props.className,
      )}
    >
      {children}
      <svg
        className="w-5 h-5 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 9l-7 7-7-7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    </RadixAccordion.Trigger>
  ),
  Content: ({
    children,
    ...props
  }: ComponentProps<typeof RadixAccordion.Content>) => (
    <RadixAccordion.Content
      {...props}
      className={clsxm(
        "!bg-dsfr-alt-blue-france",
        "!px-6 !pb-6 !pt-4",
        "overflow-hidden",
        "accordion-content",
        props.className,
      )}
    >
      {children}
    </RadixAccordion.Content>
  ),
});
