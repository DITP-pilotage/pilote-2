import {
  Content,
  ContentCanvas,
  ContentText,
  TableCell,
} from "pdfmake/interfaces";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { CheckboxCircleFillIcon } from "@/components/_commons/Icones/CheckboxCircleFillIcon";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { htmlToPdfmake } from "@/server/pdf/htmlToPdfmake";
import { iconSvg } from "@/server/pdf/svgFromComponent";
import { px, rem, cssLineHeight } from "@/server/pdf/units";

export const TEXT_COLOR = "#3A3A3A";
export const TITLE_COLOR = "#161616";
export const MENTION_COLOR = "#666666";
export const PRIMARY_COLOR = "#000091";
const BLOC_BORDER_COLOR = "#7B7B7B";
const BLOC_TITLE_BORDER_COLOR = "#3A3A3A";
export const BLOC_TITLE_BACKGROUND = "#E3E3FD";
const SEPARATOR_COLOR = "#DDDDDD";
const TABLE_HEADER_BORDER_COLOR = "#3A3A3A";
const ZEBRA_BACKGROUND = "#F6F6F6";

export type BadgeVariant =
  "default" | "success" | "error" | "info" | "warning" | "green-tilleul";

const BADGE_COLORS: Record<BadgeVariant, { background: string; text: string }> =
  {
    default: { background: "#EEEEEE", text: "#3A3A3A" },
    success: { background: "#B8FEC9", text: "#18753C" },
    error: { background: "#FFE9E9", text: "#CE0500" },
    info: { background: "#E8EDFF", text: "#0063CB" },
    warning: { background: "#FFE9E6", text: "#B34000" },
    "green-tilleul": { background: "#FCEEAC", text: "#695240" },
  };

const BADGE_SIZES = {
  sm: {
    fontSize: px(12),
    lineHeight: cssLineHeight(20, 12),
    paddingX: px(6),
    icon: px(12),
  },
  md: {
    fontSize: px(14),
    lineHeight: cssLineHeight(24, 14),
    paddingX: px(8),
    icon: px(16),
  },
};

export function badgePdf(
  text: string,
  variant: BadgeVariant,
  options: { size?: "sm" | "md"; iconSvg?: string } = {},
): Content {
  const size = BADGE_SIZES[options.size ?? "sm"];
  const colors = BADGE_COLORS[variant];
  const label: ContentText = {
    text: text.toLocaleUpperCase("fr-FR"),
    noWrap: true,
    bold: true,
    fontSize: size.fontSize,
    lineHeight: size.lineHeight,
    color: colors.text,
  };
  const cell: TableCell = options.iconSvg
    ? {
        columns: [
          { svg: options.iconSvg, width: size.icon, margin: [0, px(4), 0, 0] },
          { ...label, width: "auto" },
        ],
        columnGap: px(4),
        fillColor: colors.background,
      }
    : { ...label, fillColor: colors.background };
  return {
    table: { widths: ["auto"], body: [[cell]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => size.paddingX,
      paddingRight: () => size.paddingX,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

const PROGRESS_BAR_HEIGHTS = { sm: px(12), md: px(12) };
const PROGRESS_BAR_BACKGROUNDS = {
  blanc: "#FFFFFF",
  "gris-clair": "#E5E5E5",
  "gris-moyen": "#BABABA",
  bleu: "#BFCCFB",
};

export function barreDeProgressionPdf(params: {
  valeur: number | null;
  size: "sm" | "md";
  background: keyof typeof PROGRESS_BAR_BACKGROUNDS;
  fill: string;
  label: "side" | "top";
  width: number;
}): Content {
  const height = PROGRESS_BAR_HEIGHTS[params.size];
  const radius = px(6);
  const labelText: ContentText = {
    text: params.valeur === null ? "- %" : `${params.valeur.toFixed(0)} %`,
    noWrap: true,
    bold: true,
    fontSize: px(16),
    color: TEXT_COLOR,
  };
  const canvas: ContentCanvas = {
    canvas: [
      {
        type: "rect",
        x: 0,
        y: 0,
        w: params.width,
        h: height,
        r: radius,
        color: PROGRESS_BAR_BACKGROUNDS[params.background],
        lineColor: "#BABABA",
        lineWidth: px(1),
      },
      ...(params.valeur
        ? [
            {
              type: "rect" as const,
              x: 0,
              y: 0,
              w: params.width * (Math.min(params.valeur, 100) / 100),
              h: height,
              r: radius,
              color: params.fill,
            },
          ]
        : []),
    ],
  };
  if (params.label === "top") return { stack: [labelText, canvas] };
  return {
    columns: [
      { stack: [canvas], width: params.width, margin: [0, px(6), 0, 0] },
      { ...labelText, width: "auto", margin: [px(8), 0, 0, 0] },
    ],
  };
}

export type BlocParams = {
  titre?: string;
  titreBackground?: string;
  content: Content;
  padding?: number;
  withInfo?: boolean;
};

function blocTitleCell(params: BlocParams): TableCell {
  const title: ContentText = {
    text: params.titre ?? "",
    bold: true,
    fontSize: px(16),
    color: TITLE_COLOR,
  };
  return {
    ...(params.withInfo
      ? {
          columns: [
            { ...title, width: "auto" },
            {
              svg: iconSvg(InformationPleineIcon, PRIMARY_COLOR),
              width: px(24),
              margin: [px(16), -px(2), 0, 0],
            },
          ],
        }
      : title),
    fillColor: params.titreBackground ?? BLOC_TITLE_BACKGROUND,
    margin: [px(16), px(20), px(16), px(20)],
  };
}

function blocContentCell(params: BlocParams): TableCell {
  const padding = params.padding ?? px(16);
  return {
    stack: [params.content],
    margin: [padding, padding, padding, padding],
  };
}

function blocLayout(titled: boolean) {
  return {
    hLineWidth: (index: number, node: { table: { body: unknown[] } }) =>
      index === 0 || index === node.table.body.length
        ? px(1)
        : titled && index === 1
          ? px(2)
          : 0,
    vLineWidth: () => px(1),
    hLineColor: (index: number) =>
      titled && index === 1 ? BLOC_TITLE_BORDER_COLOR : BLOC_BORDER_COLOR,
    vLineColor: () => BLOC_BORDER_COLOR,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  };
}

export function blocPdf(params: BlocParams & { breakable?: boolean }): Content {
  const body: TableCell[][] = [];
  if (params.titre) body.push([blocTitleCell(params)]);
  body.push([blocContentCell(params)]);
  return {
    table: { widths: ["*"], body, dontBreakRows: !params.breakable },
    layout: blocLayout(Boolean(params.titre)),
  };
}

const NO_BORDER: [boolean, boolean, boolean, boolean] = [
  false,
  false,
  false,
  false,
];

export function blocRowPdf(
  blocs: BlocParams[],
  options: { columns: number; width: number; gap: number },
): Content {
  const blocWidth =
    (options.width - options.gap * (options.columns - 1)) / options.columns;
  const titled = blocs.some((bloc) => bloc.titre);
  const widths: number[] = [];
  const titleRow: TableCell[] = [];
  const contentRow: TableCell[] = [];
  for (let index = 0; index < options.columns; index += 1) {
    if (index > 0) {
      widths.push(options.gap);
      titleRow.push({ text: "", border: NO_BORDER });
      contentRow.push({ text: "", border: NO_BORDER });
    }
    widths.push(blocWidth);
    const bloc = blocs.at(index);
    if (bloc) {
      titleRow.push(blocTitleCell(bloc));
      contentRow.push(blocContentCell(bloc));
    } else {
      titleRow.push({ text: "", border: NO_BORDER });
      contentRow.push({ text: "", border: NO_BORDER });
    }
  }
  return {
    table: {
      widths: widths.map((width) => width - px(1)),
      body: titled ? [titleRow, contentRow] : [contentRow],
      dontBreakRows: true,
    },
    layout: blocLayout(titled),
  };
}

export function encartPdf(titre: string, level: "h1" | "h2" = "h2"): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: titre,
            bold: true,
            fontSize: rem(2),
            lineHeight: cssLineHeight(2.5, 2),
            color: level === "h2" ? PRIMARY_COLOR : TITLE_COLOR,
            fillColor: BLOC_TITLE_BACKGROUND,
            margin: [px(32), px(16), px(32), px(16)],
          },
        ],
      ],
    },
    layout: "noBorders",
  };
}

export function sectionTitlePdf(
  text: string,
  options: {
    size?: "h4" | "lg";
    color?: string;
    margin?: [number, number, number, number];
  } = {},
): Content {
  const size = options.size ?? "h4";
  return {
    text,
    bold: size === "h4",
    fontSize: size === "h4" ? rem(1.5) : px(18),
    lineHeight: size === "h4" ? cssLineHeight(2, 1.5) : cssLineHeight(28, 18),
    color: options.color ?? PRIMARY_COLOR,
    margin: options.margin ?? [0, 0, 0, px(16)],
  };
}

export function separatorPdf(
  margin: [number, number, number, number] = [0, px(8), 0, px(8)],
): Content {
  return {
    table: { widths: ["*"], body: [[""]] },
    layout: {
      hLineWidth: (index: number) => (index === 0 ? px(1) : 0),
      vLineWidth: () => 0,
      hLineColor: () => SEPARATOR_COLOR,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin,
  };
}

const ALERTE_TYPES = {
  info: { color: "#0063CB", icon: InformationPleineIcon },
  succes: { color: "#18753C", icon: CheckboxCircleFillIcon },
  warning: { color: "#B34000", icon: WarningIcon },
  erreur: { color: "#CE0500", icon: CloseCircleIcon },
};

export function alertePdf(params: {
  type: keyof typeof ALERTE_TYPES;
  titre?: string;
  message?: string;
}): Content {
  const { color, icon } = ALERTE_TYPES[params.type];
  const body: Content[] = [];
  if (params.titre) {
    body.push({
      text: params.titre,
      bold: true,
      fontSize: px(20),
      lineHeight: cssLineHeight(28, 20),
      color: TITLE_COLOR,
      margin: [0, 0, 0, px(4)],
    });
  }
  if (params.message) {
    body.push({ text: params.message, fontSize: px(16), color: TEXT_COLOR });
  }
  return {
    table: {
      widths: [rem(2.5), "*"],
      body: [
        [
          {
            svg: iconSvg(icon, "#FFFFFF"),
            width: px(24),
            fillColor: color,
            margin: [px(8), px(16), px(8), 0],
          },
          { stack: body, margin: [px(16), px(16), px(36), px(12)] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => px(1),
      vLineWidth: () => px(1),
      hLineColor: () => color,
      vLineColor: () => color,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

export function publicationRubriquePdf(params: {
  titre: string;
  dateEtAuteur: string | null;
  html: string | null;
}): Content {
  const content: Content[] = [
    {
      text: params.titre,
      bold: true,
      fontSize: px(20),
      lineHeight: cssLineHeight(28, 20),
      color: TITLE_COLOR,
      margin: [0, 0, 0, px(4)],
    },
  ];
  if (params.html) {
    if (params.dateEtAuteur) {
      content.push({
        text: params.dateEtAuteur,
        fontSize: px(12),
        color: MENTION_COLOR,
        margin: [0, 0, 0, px(4)],
      });
    }
    content.push(...htmlToPdfmake(params.html));
  } else {
    content.push(badgePdf("Non renseigné", "default"));
  }
  return { stack: content, margin: [px(24), px(16), px(24), px(16)] };
}

function middleAligned(cell: Content): TableCell {
  if (typeof cell === "object" && "table" in cell) return cell;
  return { stack: [cell], verticalAlignment: "middle" };
}

export function tablePdf(params: {
  headers: string[];
  widths: (number | "*" | "auto")[];
  rows: Content[][];
  cellPadding?: [number, number];
  framedTitle?: string;
}): Content {
  const [paddingY, paddingX] = params.cellPadding ?? [px(16), px(16)];
  const framed = params.framedTitle !== undefined;
  const titleRows: TableCell[][] = framed
    ? [
        [
          {
            text: params.framedTitle ?? "",
            colSpan: params.headers.length,
            bold: true,
            fontSize: px(18),
            lineHeight: cssLineHeight(28, 18),
            color: PRIMARY_COLOR,
          },
          ...params.headers.slice(1).map(() => ""),
        ],
      ]
    : [];
  const headerIndex = titleRows.length;
  return {
    table: {
      headerRows: headerIndex + 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths: params.widths.map((width) =>
        typeof width === "number" ? width - 2 * paddingX : width,
      ),
      body: [
        ...titleRows,
        params.headers.map((header) => ({
          verticalAlignment: "middle" as const,
          fillColor: BLOC_TITLE_BACKGROUND,
          text: header,
          bold: true,
          fontSize: px(14),
          lineHeight: cssLineHeight(24, 14),
          color: TITLE_COLOR,
        })),
        ...params.rows.map((row) => row.map(middleAligned)),
      ],
    },
    layout: {
      hLineWidth: (index: number, node) =>
        index === headerIndex + 1
          ? px(1)
          : framed && (index === 0 || index === node.table.body.length)
            ? px(1)
            : 0,
      vLineWidth: (index: number, node) =>
        framed && (index === 0 || index === node.table.widths?.length)
          ? px(1)
          : 0,
      hLineColor: (index: number) =>
        index === headerIndex + 1
          ? TABLE_HEADER_BORDER_COLOR
          : BLOC_BORDER_COLOR,
      vLineColor: () => BLOC_BORDER_COLOR,
      fillColor: (rowIndex: number, _node, columnIndex: number) => {
        const dataIndex = rowIndex - headerIndex;
        return dataIndex > 0 && columnIndex === 0 && dataIndex % 2 === 0
          ? ZEBRA_BACKGROUND
          : null;
      },
      paddingLeft: () => paddingX,
      paddingRight: () => paddingX,
      paddingTop: () => paddingY,
      paddingBottom: (index: number) =>
        index === headerIndex ? paddingY + px(2) : paddingY,
    },
  };
}
