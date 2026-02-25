import { ComponentType, createElement, Fragment, ReactNode } from "react";
import { Callout } from "@/client/components/shared/Callout";
import { Accordion } from "@/client/components/shared/Accordion";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { EtoileIcon } from "@/components/_commons/Icones/EtoileIcon";

type IconComponent = ComponentType<{ className: string; fill: string }>;

const calloutIconMap: Record<string, IconComponent> = {
  info: InformationPleineIcon,
  success: InformationPleineIcon,
  warning: WarningIcon,
  error: ErrorWarningIcon,
  blue: InformationPleineIcon,
  moutarde: WarningIcon,
};

const iconeMap: Record<string, IconComponent> = {
  info: InformationPleineIcon,
  warning: WarningIcon,
  error: ErrorWarningIcon,
  arrowLine1: ArrowLine1Icon,
  etoile: EtoileIcon,
};

function renderChildren(element: Element): ReactNode[] {
  return Array.from(element.childNodes).map((child, index) => (
    <Fragment key={index}>{renderNode(child)}</Fragment>
  ));
}

function renderNode(node: Node): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const dataType = element.getAttribute("data-type");

  if (dataType === "callout") {
    const color =
      (element.getAttribute("data-color") as
        | "info"
        | "success"
        | "warning"
        | "error"
        | "blue"
        | "moutarde") || "info";
    const IconeCallout = calloutIconMap[color] || InformationPleineIcon;

    return (
      <Callout.Root color={color}>
        <Callout.Icon icone={IconeCallout} />
        <Callout.Text>{renderChildren(element)}</Callout.Text>
      </Callout.Root>
    );
  }

  if (dataType === "accordion-item") {
    const title = element.getAttribute("data-title") || "Titre";

    return (
      <Accordion.Root collapsible defaultValue="item-1" type="single">
        <Accordion.Item value="item-1">
          <Accordion.Header>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>{renderChildren(element)}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  }

  if (dataType === "icone") {
    const iconType = element.getAttribute("data-icon-type") || "info";
    const Icon = iconeMap[iconType];
    if (!Icon) return null;
    return (
      <Icon className="w-5 h-5 inline-block align-middle" fill="currentColor" />
    );
  }

  const tag = element.tagName.toLowerCase();
  const children = renderChildren(element);

  const props: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === "class") {
      props.className = attr.value;
    } else if (attr.name !== "style") {
      props[attr.name] = attr.value;
    }
  }

  return createElement(tag, props, ...children);
}

export function RenduContenuHtml({ html }: { html: string }) {
  if (!html) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  return <>{renderChildren(doc.body)}</>;
}
