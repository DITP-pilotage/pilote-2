import { ComponentType, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JaugeDeProgressionSVG from "@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG";
import JaugeDeProgressionSVGSmall from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSVGSmall";
import {
  JaugeDeProgressionCouleur,
  JaugeDeProgressionTaille,
} from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { MeteoComponentMap } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import { findColor } from "@/server/pdf/colors";

type FlattenOptions = { currentColor?: string };

function classToAttributes(token: string): [string, string] | null {
  const strokeWidth = /^\[stroke-width:([\d.]+)\]$/.exec(token);
  if (strokeWidth) return ["stroke-width", strokeWidth[1]];
  if (token === "fill-none") return ["fill", "none"];
  if (token === "stroke-none") return ["stroke", "none"];
  if (token === "fill-current") return ["fill", "currentColor"];
  if (token === "stroke-current") return ["stroke", "currentColor"];
  for (const [prefix, attribute] of [
    ["fill-", "fill"],
    ["stroke-", "stroke"],
  ] as const) {
    if (token.startsWith(prefix)) {
      const value = findColor(token.slice(prefix.length));
      return value ? [attribute, value] : null;
    }
  }
  return null;
}

function flattenTag(attributes: string): string {
  const classMatch = /\sclass="([^"]*)"/.exec(attributes);
  if (!classMatch) return attributes;
  const replacements = classMatch[1]
    .split(/\s+/)
    .filter(Boolean)
    .map(classToAttributes)
    .filter((attribute): attribute is [string, string] => attribute !== null);
  let flattened = attributes.replace(classMatch[0], "");
  for (const [name] of replacements) {
    flattened = flattened.replace(new RegExp(`\\s${name}="[^"]*"`), "");
  }
  const added = replacements
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");
  const selfClosing = flattened.endsWith("/");
  const body = selfClosing ? flattened.slice(0, -1) : flattened;
  return `${body}${added}${selfClosing ? "/" : ""}`;
}

function sanitizeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "");
}

export function flattenSvgClasses(
  svg: string,
  options: FlattenOptions = {},
): string {
  let flattened = svg.replace(
    /<([a-zA-Z][\w:-]*)([^<>]*?)>/g,
    (_tag, name: string, attributes: string) =>
      `<${name}${flattenTag(attributes)}>`,
  );
  flattened = flattened
    .replace(
      /\sid="([^"]*)"/g,
      (_match, id: string) => ` id="${sanitizeId(id)}"`,
    )
    .replace(
      /url\(#([^)]*)\)/g,
      (_match, id: string) => `url(#${sanitizeId(id)})`,
    );
  if (options.currentColor) {
    flattened = flattened.replaceAll("currentColor", options.currentColor);
  }
  return flattened;
}

export function renderSvg(
  element: ReactElement,
  options: FlattenOptions = {},
): string {
  const markup = renderToStaticMarkup(element);
  const svg = /<svg[\s\S]*<\/svg>/.exec(markup);
  if (!svg) throw new Error("Le composant ne rend aucun SVG");
  return flattenSvgClasses(svg[0], options);
}

export function jaugeSvg(
  pourcentage: number | null,
  couleur: JaugeDeProgressionCouleur,
  taille: JaugeDeProgressionTaille,
): string {
  return renderSvg(
    <JaugeDeProgressionSVG
      couleur={couleur}
      pourcentage={pourcentage}
      taille={taille}
    />,
  );
}

export function jaugeSmallSvg(
  pourcentage: number | null,
  couleur: JaugeDeProgressionCouleur,
): string {
  return renderSvg(
    <JaugeDeProgressionSVGSmall couleur={couleur} pourcentage={pourcentage} />,
  );
}

export function meteoPictoSvg(meteo: Meteo): string | null {
  const Picto = MeteoComponentMap[meteo];
  return Picto ? renderSvg(<Picto />) : null;
}

export function iconSvg(
  Icon: ComponentType<{ className: string; fill: string }>,
  iconColor: string,
): string {
  return renderSvg(<Icon className="" fill="currentColor" />, {
    currentColor: iconColor,
  });
}
