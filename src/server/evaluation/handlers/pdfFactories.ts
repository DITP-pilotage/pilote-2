import { Content, ContentText, TableCell } from "pdfmake/interfaces";

const COLORS = {
  primary: "#000091",
  text: "#555555",
  textLight: "#999999",
  borderLight: "#CCCCCC",
  backgroundLight: "#F6F6F6",
} as const;

export function createPageHeader({
  title,
  pageBreak,
}: {
  title: string;
  pageBreak?: "before";
}): Content {
  return {
    text: title,
    fontSize: 16,
    bold: true,
    color: COLORS.primary,
    margin: [0, 0, 0, 15],
    pageBreak,
  };
}

interface TextOptions {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  fontSize?: number;
  alignment?: "left" | "center" | "right" | "justify";
  margin?: [number, number, number, number];
}

export function createText(
  text: string | ContentText[],
  options: TextOptions = {},
): TableCell {
  return {
    text,
    fontSize: options.fontSize ?? 8,
    bold: options.bold ?? false,
    italics: options.italics ?? false,
    color: options.color ?? COLORS.text,
    alignment: options.alignment ?? "left",
    margin: options.margin ?? [5, 5, 5, 5],
  };
}

export function createSectionTitle(title: string): TableCell {
  return {
    text: title,
    fontSize: 10,
    bold: true,
    colSpan: 2,
    margin: [5, 5, 5, 5],
  };
}

export function createScoreCell(score: string): TableCell {
  return createText(score, {
    bold: true,
    alignment: "center",
    color: COLORS.primary,
  });
}

export function createCommentCell(comment: string | null): TableCell {
  return createText(comment || "Aucun commentaire", {
    color: comment ? COLORS.text : COLORS.textLight,
    italics: !comment,
  });
}

interface TableLayout {
  rowModulo: number;
}

export function createTable(
  body: TableCell[][],
  layout: TableLayout = { rowModulo: 2 },
): Content {
  return {
    table: {
      headerRows: 0,
      widths: ["*", 80],
      body,
    },
    layout: {
      hLineWidth: (i: number) => {
        return i % layout.rowModulo === 0 ? 1 : 0.5;
      },
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.borderLight,
      vLineColor: () => COLORS.borderLight,
      fillColor: (i: number) => {
        return i % layout.rowModulo === 0 ? COLORS.backgroundLight : null;
      },
    },
    margin: [0, 0, 0, 20],
  };
}

export function createLabeledText(
  label: string,
  text: string | null,
): ContentText[] {
  return [
    { text: `${label} :\n`, bold: true },
    {
      text: text || `Aucun${label.toLowerCase().replace(":", "")}`,
      color: text ? COLORS.text : COLORS.textLight,
      italics: !text,
    },
  ];
}
