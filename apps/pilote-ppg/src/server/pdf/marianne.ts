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
  const fontsDirectory = path.join(
    process.cwd(),
    "node_modules/@gouvfr/dsfr/dist/fonts",
  );
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
