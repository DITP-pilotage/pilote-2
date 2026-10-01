import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const POLICE_MARIANNE = "Marianne";

const FICHIERS = [
  "Marianne-Light",
  "Marianne-Light_Italic",
  "Marianne-Regular",
  "Marianne-Regular_Italic",
  "Marianne-Medium",
  "Marianne-Medium_Italic",
  "Marianne-Bold",
  "Marianne-Bold_Italic",
];

export function vfsMarianne(): Record<string, string> {
  const dossierPolices = path.join(
    path.dirname(
      createRequire(import.meta.url).resolve("@gouvfr/dsfr/package.json"),
    ),
    "dist/fonts",
  );
  return Object.fromEntries(
    FICHIERS.map((fichier) => [
      `${fichier}.woff2`,
      readFileSync(path.join(dossierPolices, `${fichier}.woff2`)).toString(
        "base64",
      ),
    ]),
  );
}

export const POLICES_MARIANNE = {
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
