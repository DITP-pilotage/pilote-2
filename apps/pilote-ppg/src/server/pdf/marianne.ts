import { readFileSync } from "node:fs";
import path from "node:path";

export const MARIANNE_FONT = "Marianne";

const FONT_FILES = [
  "Marianne-Light",
  "Marianne-Light_Italic",
  "Marianne-Regular",
  "Marianne-Regular_Italic",
  "Marianne-Medium",
  "Marianne-Medium_Italic",
  "Marianne-Bold",
  "Marianne-Bold_Italic",
];

export const SYMBOLS_FONT = "NotoSansSymbols2";

const SYMBOLS_FONT_FILE = "NotoSansSymbols2-Regular.ttf";

let marianneLoaded = false;

export function marianneVfs(): Record<string, string> {
  const fontsDirectory = path.join(process.cwd(), "public/fonts");
  return {
    ...Object.fromEntries(
      FONT_FILES.map((file) => [
        `${file}.woff2`,
        readFileSync(
          path.join(fontsDirectory, "marianne", `${file}.woff2`),
        ).toString("base64"),
      ]),
    ),
    [SYMBOLS_FONT_FILE]: readFileSync(
      path.join(fontsDirectory, "noto-sans-symbols-2", SYMBOLS_FONT_FILE),
    ).toString("base64"),
  };
}

export function ensureMarianneLoaded(
  register: (vfs: Record<string, string>) => void,
) {
  if (marianneLoaded) return;
  register(marianneVfs());
  marianneLoaded = true;
}

export const MARIANNE_FONTS = {
  Marianne: {
    normal: "Marianne-Regular.woff2",
    bold: "Marianne-Bold.woff2",
    italics: "Marianne-Regular_Italic.woff2",
    bolditalics: "Marianne-Bold_Italic.woff2",
  },
  MarianneMedium: {
    normal: "Marianne-Medium.woff2",
    bold: "Marianne-Bold.woff2",
    italics: "Marianne-Medium_Italic.woff2",
    bolditalics: "Marianne-Bold_Italic.woff2",
  },
  MarianneLight: {
    normal: "Marianne-Light.woff2",
    bold: "Marianne-Regular.woff2",
    italics: "Marianne-Light_Italic.woff2",
    bolditalics: "Marianne-Regular_Italic.woff2",
  },
  [SYMBOLS_FONT]: {
    normal: SYMBOLS_FONT_FILE,
    bold: SYMBOLS_FONT_FILE,
    italics: SYMBOLS_FONT_FILE,
    bolditalics: SYMBOLS_FONT_FILE,
  },
};

const GLYPH_SUBSTITUTES: [RegExp, string][] = [
  [/\u202f/g, "\u00a0"],
  [/[\u2012\u2043]/g, "\u2013"],
];

const SYMBOLS = /([\u2219\u25a0-\u25ff\u2600-\u27bf]+)/;

type TextRun = string | { text: string; font: string };

function withAvailableGlyphs(text: string): string {
  return GLYPH_SUBSTITUTES.reduce(
    (result, [glyphs, substitute]) => result.replace(glyphs, substitute),
    text,
  );
}

function withSymbolsFont(text: string): string | TextRun[] {
  const available = withAvailableGlyphs(text);
  if (!SYMBOLS.test(available)) return available;
  return available
    .split(SYMBOLS)
    .filter((part) => part !== "")
    .map((part) =>
      SYMBOLS.test(part) ? { text: part, font: SYMBOLS_FONT } : part,
    );
}

export function replaceGlyphsMissingFromMarianne(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      if (typeof item !== "string") {
        replaceGlyphsMissingFromMarianne(item);
        return;
      }
      const runs = withSymbolsFont(item);
      node[index] = typeof runs === "string" ? runs : { text: runs };
    });
    return;
  }
  if (typeof node !== "object" || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "svg") continue;
    if (typeof value === "string") {
      Reflect.set(
        node,
        key,
        key === "text" ? withSymbolsFont(value) : withAvailableGlyphs(value),
      );
    } else {
      replaceGlyphsMissingFromMarianne(value);
    }
  }
}
