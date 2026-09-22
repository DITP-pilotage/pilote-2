import { createElement, Fragment, ReactNode } from "react";
import {
  Callout,
  CalloutColor,
  iconeCallout,
} from "@/client/components/shared/Callout";
import { Accordion } from "@/client/components/shared/Accordion";
import { classesMedia } from "@/client/components/_commons/CentreAide/alignementMedia";
import { LecteurVideo } from "@/client/components/_commons/CentreAide/LecteurVideo";
import { registreIcones } from "./registreIcones";

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

  if (element.tagName === "BR") {
    return renderBr(node);
  }

  const dataType = element.getAttribute("data-type");

  if (dataType === "callout") {
    const color =
      (element.getAttribute("data-color") as CalloutColor) || "info";

    return (
      <Callout.Root color={color}>
        <Callout.Icon icone={iconeCallout(color)} />
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
    const Icon = registreIcones[iconType];
    if (!Icon) return null;
    return (
      <Icon className="w-5 h-5 inline-block align-middle" fill="currentColor" />
    );
  }

  if (dataType === "video") {
    const src = element.getAttribute("data-src");
    if (!src) return null;
    return (
      <LecteurVideo
        alignement={element.getAttribute("data-align")}
        largeur={element.getAttribute("data-largeur")}
        src={src}
      />
    );
  }

  if (element.tagName === "IMG") {
    const src = element.getAttribute("src");
    if (!src) return null;
    return (
      <img
        alt={element.getAttribute("alt") ?? ""}
        className={`${classesMedia({
          alignement: element.getAttribute("data-align"),
          largeur: element.getAttribute("data-largeur"),
        })} rounded`}
        src={src}
      />
    );
  }

  if (element.tagName === "IFRAME") {
    const src = element.getAttribute("src");
    if (!src) return null;
    return (
      <LecteurVideo
        src={src}
        titre={element.getAttribute("title") ?? undefined}
      />
    );
  }

  const tag = element.tagName.toLowerCase();
  const children = renderChildren(element);

  const props: Record<string, unknown> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === "class") {
      props.className = attr.value;
    } else if (attr.name === "style") {
      const styleObj: Record<string, string> = {};
      for (const declaration of attr.value.split(";")) {
        const colonIndex = declaration.indexOf(":");
        if (colonIndex === -1) continue;
        const property = declaration.slice(0, colonIndex).trim();
        const value = declaration.slice(colonIndex + 1).trim();
        if (!property) continue;
        const camelCase = property.replace(
          /-([a-z])/g,
          (_match, letter: string) => letter.toUpperCase(),
        );
        styleObj[camelCase] = value;
      }
      props.style = styleObj;
    } else {
      props[attr.name] = attr.value;
    }
  }

  return createElement(tag, props, ...children);
}

const estDernierEnfantSignificatif = (node: Node): boolean => {
  let suivant = node.nextSibling;
  while (suivant) {
    if (
      suivant.nodeType === Node.ELEMENT_NODE ||
      (suivant.nodeType === Node.TEXT_NODE &&
        suivant.textContent?.trim() !== "")
    ) {
      return false;
    }
    suivant = suivant.nextSibling;
  }
  return true;
};

const BLOCS_AVEC_BR_FINAL = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "DIV",
  "BLOCKQUOTE",
]);

function renderBr(node: Node): ReactNode {
  const parent = node.parentElement;
  if (
    parent &&
    BLOCS_AVEC_BR_FINAL.has(parent.tagName) &&
    estDernierEnfantSignificatif(node)
  ) {
    return (
      <>
        <br />
        <br />
      </>
    );
  }
  return <br />;
}

// Echelle de titres subordonnee au titre de l'article : sans elle, un h1 saisi
// dans le contenu s'affiche plus gros que le titre du document.
export const classesRenduContenuHtml = [
  "[&_p]:mb-0 [&_p]:leading-7",
  "[&_a]:text-primary",
  "[&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3",
  "[&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:mt-7 [&_h2]:mb-2",
  "[&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2",
  "[&_h4]:text-[16px] [&_h4]:font-bold [&_h4]:mt-5 [&_h4]:mb-2",
  "[&_h5]:text-[15px] [&_h5]:font-bold [&_h5]:mt-4 [&_h5]:mb-1",
  "[&_h6]:text-[14px] [&_h6]:font-bold [&_h6]:mt-4 [&_h6]:mb-1",
  "[&_hr]:!my-6 [&_hr]:border-dsfr-grey-925",
  "[&_ul]:pl-6 [&_ol]:pl-8 [&_ul]:list-disc [&_ol]:list-decimal",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-dsfr-blue-france-850",
  "[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-dsfr-mention-grey",
  "[&_blockquote]:my-4",
].join(" ");

export const RenduContenuHtml = ({
  html,
  className,
}: {
  html: string;
  className?: string;
}) => {
  if (!html) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  return <div className={className}>{renderChildren(doc.body)}</div>;
};
