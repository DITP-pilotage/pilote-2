import { ComponentType, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JaugeDeProgressionSVG from "@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG";
import JaugeDeProgressionSVGSmall from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSVGSmall";
import {
  JaugeDeProgressionCouleur,
  JaugeDeProgressionTaille,
} from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { MeteoComponentMap } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { Meteo } from "@/shared/meteo/Meteo.interface";
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

function styleToAttributes(style: string): [string, string][] {
  return style
    .split(";")
    .map((declaration): [string, string] => {
      const separator = declaration.indexOf(":");
      return [
        declaration.slice(0, separator).trim(),
        declaration.slice(separator + 1).trim(),
      ];
    })
    .filter(([name, value]) => name.length > 0 && value.length > 0);
}

function flattenTag(attributes: string): string {
  const classMatch = /\sclass="([^"]*)"/.exec(attributes);
  const styleMatch = /\sstyle="([^"]*)"/.exec(attributes);
  if (!classMatch && !styleMatch) return attributes;
  const fromStyle = styleMatch ? styleToAttributes(styleMatch[1]) : [];
  const fromClasses = (classMatch?.[1] ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map(classToAttributes)
    .filter((attribute): attribute is [string, string] => attribute !== null)
    .filter(([name]) => !fromStyle.some(([styleName]) => styleName === name));
  const replacements = [...fromClasses, ...fromStyle];
  let flattened = attributes;
  for (const match of [classMatch, styleMatch]) {
    if (match) flattened = flattened.replace(match[0], "");
  }
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

function cached<Value>(
  cache: Map<string, Value>,
  key: string,
  render: () => Value,
): Value {
  const existing = cache.get(key);
  if (existing !== undefined) return existing;
  const value = render();
  cache.set(key, value);
  return value;
}

type IconComponent = ComponentType<{ className: string; fill: string }>;

const jaugeCache = new Map<string, string>();
const meteoPictoCache = new Map<string, string | null>();
const iconCache = new WeakMap<IconComponent, Map<string, string>>();

export function jaugeSvg(
  pourcentage: number | null,
  couleur: JaugeDeProgressionCouleur,
  taille: JaugeDeProgressionTaille,
): string {
  return cached(jaugeCache, `normal|${pourcentage}|${couleur}|${taille}`, () =>
    renderSvg(
      <JaugeDeProgressionSVG
        couleur={couleur}
        pourcentage={pourcentage}
        taille={taille}
      />,
    ),
  );
}

export function jaugeSmallSvg(
  pourcentage: number | null,
  couleur: JaugeDeProgressionCouleur,
): string {
  return cached(jaugeCache, `small|${pourcentage}|${couleur}`, () =>
    renderSvg(
      <JaugeDeProgressionSVGSmall
        couleur={couleur}
        pourcentage={pourcentage}
      />,
    ),
  );
}

export function meteoPictoSvg(meteo: Meteo): string | null {
  return cached(meteoPictoCache, String(meteo), () => {
    const Picto = MeteoComponentMap[meteo];
    return Picto ? renderSvg(<Picto />) : null;
  });
}

export function iconSvg(Icon: IconComponent, iconColor: string): string {
  const byColor = iconCache.get(Icon) ?? new Map<string, string>();
  iconCache.set(Icon, byColor);
  return cached(byColor, iconColor, () =>
    renderSvg(<Icon className="" fill="currentColor" />, {
      currentColor: iconColor,
    }),
  );
}
