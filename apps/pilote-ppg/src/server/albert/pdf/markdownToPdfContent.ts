import { CanvasElement, Content } from "pdfmake/interfaces";
import { lexer, Token, Tokens } from "marked";
import { COLORS } from "@/server/evaluation/handlers/pdfFactories";

const HEADING_STYLES: Record<
  number,
  {
    fontSize: number;
    color: string;
    margin: [number, number, number, number];
  }
> = {
  1: { fontSize: 13, color: COLORS.primary, margin: [0, 10, 0, 6] },
  2: { fontSize: 11, color: COLORS.primary, margin: [0, 8, 0, 5] },
  3: { fontSize: 10, color: COLORS.text, margin: [0, 6, 0, 4] },
  4: { fontSize: 9, color: COLORS.text, margin: [0, 4, 0, 4] },
};

function convertInlineTokens(tokens: Token[]): Content[] {
  const result: Content[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const textToken = token as Tokens.Text;
        if (textToken.tokens && textToken.tokens.length > 0) {
          result.push(...convertInlineTokens(textToken.tokens));
        } else {
          result.push(textToken.text);
        }
        break;
      }
      case "strong": {
        const strongToken = token as Tokens.Strong;
        result.push({
          text: convertInlineTokens(strongToken.tokens),
          bold: true,
        });
        break;
      }
      case "em": {
        const emToken = token as Tokens.Em;
        result.push({
          text: convertInlineTokens(emToken.tokens),
          italics: true,
        });
        break;
      }
      case "codespan": {
        const codespanToken = token as Tokens.Codespan;
        result.push({
          text: codespanToken.text,
          font: "Courier",
          fontSize: 8,
          background: COLORS.backgroundLight,
        });
        break;
      }
      case "br": {
        result.push("\n");
        break;
      }
      case "escape": {
        const escapeToken = token as Tokens.Escape;
        result.push(escapeToken.text);
        break;
      }
      case "link": {
        const linkToken = token as Tokens.Link;
        result.push({
          text: convertInlineTokens(linkToken.tokens),
          color: "#0063CB",
          decoration: "underline",
        });
        break;
      }
      case "del": {
        const delToken = token as Tokens.Del;
        result.push({
          text: convertInlineTokens(delToken.tokens),
          decoration: "lineThrough",
        });
        break;
      }
      default: {
        const generic = token as Tokens.Generic;
        if (generic.raw) {
          result.push(generic.raw);
        }
        break;
      }
    }
  }

  return result;
}

// Roboto n'a pas de glyphe ☐ / ☑ : la case est dessinée.
function caseACocher(cochee: boolean): CanvasElement[] {
  const cadre: CanvasElement = {
    type: "rect",
    x: 0,
    y: 1.5,
    w: 7,
    h: 7,
    lineWidth: 0.7,
    lineColor: COLORS.text,
  };
  if (!cochee) {
    return [cadre];
  }
  return [
    cadre,
    {
      type: "polyline",
      points: [
        { x: 1.5, y: 5 },
        { x: 3, y: 6.8 },
        { x: 5.8, y: 2.8 },
      ],
      lineWidth: 1,
      lineColor: COLORS.text,
    },
  ];
}

function convertListItemTokens(tokens: Token[]): Content {
  if (
    tokens.length === 1 &&
    (tokens[0].type === "text" || tokens[0].type === "paragraph")
  ) {
    const inner = tokens[0] as Tokens.Text | Tokens.Paragraph;
    if (inner.tokens && inner.tokens.length > 0) {
      return { text: convertInlineTokens(inner.tokens), fontSize: 9 };
    }
    return { text: inner.text, fontSize: 9 };
  }

  return {
    stack: convertBlockTokens(tokens),
    fontSize: 9,
  };
}

function convertListItem(
  item: Tokens.ListItem,
): Content & { listType?: "none" } {
  const contenu = convertListItemTokens(
    item.tokens.filter((token) => token.type !== "checkbox"),
  );
  if (!item.task) {
    return contenu;
  }
  return {
    listType: "none",
    columns: [
      { canvas: caseACocher(item.checked ?? false), width: 11 },
      contenu,
    ],
  };
}

function convertBlockTokens(tokens: Token[]): Content[] {
  const result: Content[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "paragraph": {
        const paragraphToken = token as Tokens.Paragraph;
        result.push({
          text: convertInlineTokens(paragraphToken.tokens),
          fontSize: 9,
          color: COLORS.text,
          margin: [0, 0, 0, 8],
        });
        break;
      }
      case "heading": {
        const headingToken = token as Tokens.Heading;
        const depth = Math.min(headingToken.depth, 4);
        const style = HEADING_STYLES[depth];
        result.push({
          text: convertInlineTokens(headingToken.tokens),
          fontSize: style.fontSize,
          bold: true,
          color: style.color,
          margin: style.margin,
        });
        break;
      }
      case "list": {
        const listToken = token as Tokens.List;
        const items = listToken.items.map(convertListItem);

        if (listToken.ordered) {
          result.push({
            ol: items,
            fontSize: 9,
            color: COLORS.text,
            margin: [0, 0, 0, 8],
          });
        } else {
          result.push({
            ul: items,
            fontSize: 9,
            color: COLORS.text,
            margin: [0, 0, 0, 8],
          });
        }
        break;
      }
      case "code": {
        const codeToken = token as Tokens.Code;
        result.push({
          text: codeToken.text,
          font: "Courier",
          fontSize: 8,
          background: COLORS.backgroundLight,
          margin: [0, 4, 0, 8],
        });
        break;
      }
      case "blockquote": {
        const blockquoteToken = token as Tokens.Blockquote;
        result.push({
          stack: convertBlockTokens(blockquoteToken.tokens),
          margin: [15, 0, 0, 8] as [number, number, number, number],
          italics: true,
        });
        break;
      }
      case "space":
      case "def": {
        break;
      }
      default: {
        const generic = token as Tokens.Generic;
        if (generic.raw) {
          result.push({
            text: generic.raw,
            fontSize: 9,
            color: COLORS.text,
            margin: [0, 0, 0, 8],
          });
        }
        break;
      }
    }
  }

  return result;
}

function sanitizeForPdf(text: string): string {
  return text.replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
}

export function markdownToPdfContent(markdown: string): Content[] {
  const tokens = lexer(sanitizeForPdf(markdown));
  return convertBlockTokens(tokens);
}
