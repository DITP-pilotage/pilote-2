import { Content } from "pdfmake/interfaces";
import { JaugeDeProgressionCouleur } from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { jaugeSmallSvg, jaugeSvg } from "@/server/pdf/svgFromComponent";
import { px, rem, cssLineHeight } from "@/server/pdf/units";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";
import { color } from "@/server/pdf/colors";

export const JAUGE_COLORS: Record<JaugeDeProgressionCouleur, string> = {
  bleu: color("primary"),
  "bleu-clair": color("dsfr-info-main-525"),
  violet: color("pilote-ecart-blue"),
  orange: color("pilote-orange"),
  vert: color("pilote-vert"),
  rose: color("dsfr-pink-tuile-main-556"),
  gris: color("dsfr-grey-625"),
};

const JAUGE_SIZES = {
  sm: {
    width: rem(3.75),
    fontSize: rem(1.125),
    lineHeight: cssLineHeight(1.5, 1.125),
  },
  md: {
    width: rem(4),
    fontSize: rem(1.375),
    lineHeight: cssLineHeight(2.5, 1.375),
  },
  lg: {
    width: rem(8.25),
    fontSize: rem(2),
    lineHeight: cssLineHeight(2.5, 2),
  },
};

const VALUE_LINE_HEIGHT = rem(2.5);
const VALUE_OFFSET_FROM_CENTER = rem(1.4);

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
    color: color("dsfr-grey-50"),
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
  const valueTop = size.width / 2 - VALUE_OFFSET_FROM_CENTER;
  const gauge: Content[] =
    params.taille === "sm"
      ? [ring, value]
      : [
          { ...value, margin: [0, valueTop, 0, 0] },
          { ...ring, margin: [0, -(valueTop + VALUE_LINE_HEIGHT), 0, 0] },
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
      { width: "*", text: "" },
      {
        width: "auto",
        columns: [
          {
            svg: jaugeSmallSvg(params.pourcentage ?? null, params.couleur),
            width: rem(3.75),
          },
          {
            width: "auto",
            margin: [px(8), rem(0.25), 0, 0],
            stack: [
              {
                text: formatPourcentage(params.pourcentage),
                bold: true,
                fontSize: rem(1.25),
                lineHeight: cssLineHeight(1.75, 1.25),
                color: JAUGE_COLORS[params.couleur],
                alignment: "center",
              },
              {
                text: params.libellé,
                fontSize: px(16),
                lineHeight: cssLineHeight(1.5, 1),
                color: color("dsfr-grey-50"),
                alignment: "center",
              },
            ],
          },
        ],
      },
      { width: "*", text: "" },
    ],
    margin: [0, 0, 0, rem(1)],
  };
}
