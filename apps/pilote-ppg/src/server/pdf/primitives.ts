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
import { color } from "@/server/pdf/colors";

export const TEXT_COLOR = color("dsfr-grey-200");
export const TITLE_COLOR = color("dsfr-grey-50");
export const MENTION_COLOR = color("dsfr-mention-grey");
export const PRIMARY_COLOR = color("primary");
const BLOC_BORDER_COLOR = color("pilote-grey-border-print");
const BLOC_TITLE_BORDER_COLOR = color("dsfr-grey-200");
export const BLOC_TITLE_BACKGROUND = color("dsfr-blue-france-925");
const TABLE_HEADER_BORDER_COLOR = color("dsfr-grey-200");
const ZEBRA_BACKGROUND = color("dsfr-grey-975");

export type BadgeVariant =
  "default" | "success" | "error" | "info" | "warning" | "green-tilleul";

const BADGE_COLORS: Record<BadgeVariant, { background: string; text: string }> =
  {
    default: {
      background: color("dsfr-grey-950"),
      text: color("dsfr-grey-200"),
    },
    success: {
      background: color("dsfr-success-950"),
      text: color("dsfr-success-425"),
    },
    error: {
      background: color("dsfr-error-950"),
      text: color("dsfr-error-425"),
    },
    info: { background: color("dsfr-info-950"), text: color("dsfr-info-425") },
    warning: {
      background: color("dsfr-warning-950"),
      text: color("dsfr-warning-425"),
    },
    "green-tilleul": {
      background: color("dsfr-green-tilleul-verveine-950"),
      text: color("dsfr-green-tilleul-verveine-sun"),
    },
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
  blanc: color("white"),
  "gris-clair": color("dsfr-grey-925"),
  "gris-moyen": color("pilote-gris-moyen"),
  bleu: color("dsfr-blue-ecume-850"),
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
        lineColor: color("pilote-gris-moyen"),
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
    headlineLevel: 1,
  };
}

export { separatorPdf } from "@/server/pdf/separator";

const ALERTE_TYPES = {
  info: { color: color("dsfr-info-425"), icon: InformationPleineIcon },
  succes: { color: color("dsfr-success-425"), icon: CheckboxCircleFillIcon },
  warning: { color: color("dsfr-warning-425"), icon: WarningIcon },
  erreur: { color: color("dsfr-error-425"), icon: CloseCircleIcon },
};

export function alertePdf(params: {
  type: keyof typeof ALERTE_TYPES;
  titre?: string;
  message?: string;
}): Content {
  const { color: alerteColor, icon } = ALERTE_TYPES[params.type];
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
            svg: iconSvg(icon, color("white")),
            width: px(24),
            fillColor: alerteColor,
            margin: [px(8), px(16), px(8), 0],
          },
          { stack: body, margin: [px(16), px(16), px(36), px(12)] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => px(1),
      vLineWidth: () => px(1),
      hLineColor: () => alerteColor,
      vLineColor: () => alerteColor,
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
