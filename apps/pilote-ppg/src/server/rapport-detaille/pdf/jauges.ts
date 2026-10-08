import { Content } from "pdfmake/interfaces";
import { JaugeDeProgressionCouleur } from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { jaugeSmallSvg, jaugeSvg } from "@/server/pdf/svgFromComponent";
import { px, rem, cssLineHeight } from "@/server/pdf/units";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

export const JAUGE_COLORS: Record<JaugeDeProgressionCouleur, string> = {
  bleu: "#000091",
  "bleu-clair": "#0078F3",
  violet: "#8585F6",
  orange: "#FC5D00",
  vert: "#27A658",
  rose: "#CE614A",
  gris: "#929292",
};

const JAUGE_SIZES = {
  sm: {
    width: rem(3.75),
    fontSize: rem(1.25),
    lineHeight: cssLineHeight(1.75, 1.25),
  },
  md: {
    width: rem(5.5),
    fontSize: rem(1.5),
    lineHeight: cssLineHeight(2, 1.5),
  },
  lg: {
    width: rem(10.5),
    fontSize: rem(2.5),
    lineHeight: cssLineHeight(3, 2.5),
  },
};

export function formatPourcentage(pourcentage: number | null | undefined) {
  return pourcentage === null || pourcentage === undefined
    ? "- %"
    : `${pourcentage.toFixed(0)}%`;
}

function caption(text: string): Content {
  return {
    text,
    fontSize: px(16),
    lineHeight: cssLineHeight(1.5, 1),
    alignment: "center",
    color: "#161616",
  };
}

export function jaugePdf(params: {
  pourcentage: number | null | undefined;
  couleur: JaugeDeProgressionCouleur;
  taille: "sm" | "md" | "lg";
  libellé?: string;
  date?: string | null;
}): Content {
  const size = JAUGE_SIZES[params.taille];
  const value: Content = {
    text: formatPourcentage(params.pourcentage),
    bold: true,
    fontSize: size.fontSize,
    lineHeight: size.lineHeight,
    color: JAUGE_COLORS[params.couleur],
    alignment: "center",
  };
  const ring: Content = {
    svg: jaugeSvg(params.pourcentage ?? null, params.couleur, params.taille),
    width: size.width,
    alignment: "center",
  };
  const valueHeight = size.fontSize * 1.5 * size.lineHeight;
  const gauge: Content[] =
    params.taille === "sm"
      ? [ring, value]
      : [
          { ...value, margin: [0, size.width / 2 - valueHeight / 2, 0, 0] },
          { ...ring, margin: [0, -(size.width / 2 + valueHeight / 2), 0, 0] },
        ];
  const date = formatParisDate(params.date, "MM/YYYY");
  return {
    stack: [
      ...gauge,
      ...(params.libellé ? [caption(params.libellé)] : []),
      ...(date ? [caption(`(${date})`)] : []),
    ],
    unbreakable: true,
  };
}

export function jaugeSmallPdf(params: {
  pourcentage: number | null | undefined;
  couleur: JaugeDeProgressionCouleur;
  libellé: string;
}): Content {
  return {
    columns: [
      {
        svg: jaugeSmallSvg(params.pourcentage ?? null, params.couleur),
        width: rem(3.75),
      },
      {
        width: "*",
        margin: [px(8), px(10), 0, 0],
        stack: [
          {
            text: formatPourcentage(params.pourcentage),
            bold: true,
            fontSize: rem(1.375),
            color: JAUGE_COLORS[params.couleur],
          },
          { text: params.libellé, fontSize: px(16), color: "#161616" },
        ],
      },
    ],
    margin: [0, 0, 0, px(16)],
  };
}
