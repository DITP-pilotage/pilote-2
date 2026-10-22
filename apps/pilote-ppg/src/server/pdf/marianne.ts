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

let marianneLoaded = false;

export function marianneVfs(): Record<string, string> {
  const fontsDirectory = path.join(process.cwd(), "public/fonts/marianne");
  return Object.fromEntries(
    FONT_FILES.map((file) => [
      `${file}.woff2`,
      readFileSync(path.join(fontsDirectory, `${file}.woff2`)).toString(
        "base64",
      ),
    ]),
  );
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
};

const GLYPHS_MISSING_FROM_MARIANNE = /\u202f/g;

function withAvailableGlyphs(text: string): string {
  return text.replace(GLYPHS_MISSING_FROM_MARIANNE, "\u00a0");
}

export function replaceGlyphsMissingFromMarianne(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      if (typeof item === "string") node[index] = withAvailableGlyphs(item);
      else replaceGlyphsMissingFromMarianne(item);
    });
    return;
  }
  if (typeof node !== "object" || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "svg") continue;
    if (typeof value === "string") {
      Reflect.set(node, key, withAvailableGlyphs(value));
    } else {
      replaceGlyphsMissingFromMarianne(value);
    }
  }
}
