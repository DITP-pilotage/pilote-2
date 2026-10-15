import TurndownService from "turndown";

const MENTION_VIDEO = "[Vidéo disponible sur la page]";

const aLeType = (node: HTMLElement, type: string) =>
  node.getAttribute?.("data-type") === type;

/**
 * Turndown aiguille les nœuds vides vers `blankReplacement` avant toute
 * règle : une vidéo est un `div` vide, qui n'atteindrait jamais la règle
 * `video`.
 */
const creerService = () => {
  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    blankReplacement: (_contenu, node) => {
      if (aLeType(node as HTMLElement, "video")) {
        return `\n\n${MENTION_VIDEO}\n\n`;
      }
      return (node as { isBlock?: boolean }).isBlock ? "\n\n" : "";
    },
  });

  service.addRule("accordeon", {
    filter: (node) => aLeType(node, "accordion-item"),
    replacement: (contenu, node) =>
      `\n\n#### ${(node as HTMLElement).getAttribute("data-title") ?? ""}\n\n${contenu.trim()}\n\n`,
  });

  service.addRule("callout", {
    filter: (node) => aLeType(node, "callout"),
    replacement: (contenu) =>
      `\n\n${contenu
        .trim()
        .split("\n")
        .map((ligne) => `> ${ligne}`.trimEnd())
        .join("\n")}\n\n`,
  });

  service.addRule("video", {
    filter: (node) => aLeType(node, "video") || node.nodeName === "IFRAME",
    replacement: () => `\n\n${MENTION_VIDEO}\n\n`,
  });

  service.addRule("image", {
    filter: "img",
    replacement: (_contenu, node) => {
      const texteAlternatif = (node as HTMLElement).getAttribute("alt")?.trim();
      return texteAlternatif
        ? `[Image : ${texteAlternatif}]`
        : "[Image disponible sur la page]";
    },
  });

  service.addRule("icone", {
    filter: (node) => aLeType(node, "icone"),
    replacement: () => "",
  });

  return service;
};

const service = creerService();

export const convertirHtmlEnMarkdown = (html: string): string =>
  service.turndown(html).trim();

const INTERTITRE = /^#{1,3}\s+(.+)$/;

export const extraireIntertitres = (markdown: string): string[] =>
  markdown.split("\n").flatMap((ligne) => {
    const correspondance = INTERTITRE.exec(ligne.trim());
    return correspondance ? [correspondance[1].trim()] : [];
  });
