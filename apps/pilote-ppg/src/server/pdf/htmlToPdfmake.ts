import { Content, ContentText } from "pdfmake/interfaces";
import { parseDocument } from "htmlparser2";
import { px, rem } from "@/server/pdf/units";

type DomNode = ReturnType<typeof parseDocument>["children"][number];
type DomElement = Extract<DomNode, { attribs: Record<string, string> }>;
type DomText = Extract<DomNode, { type: "text" }>;
type Segment = string | ContentText;

const isElement = (node: DomNode): node is DomElement => "attribs" in node;
const isText = (node: DomNode): node is DomText => node.type === "text";

const TEXT_COLOR = "#161616";
const LINK_COLOR = "#000091";
const SEPARATOR_COLOR = "#DDDDDD";
const CALLOUT_BACKGROUND = "#F5F5FE";

const HEADING_SIZES: Record<string, number> = {
  h1: rem(2.5),
  h2: rem(2),
  h3: rem(1.75),
  h4: rem(1.5),
  h5: rem(1.375),
  h6: rem(1.25),
};

const IGNORED_TAGS = new Set([
  "script",
  "style",
  "img",
  "video",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "title",
  "textarea",
  "head",
]);

const MAX_INLINE_DEPTH = 50;

type Options = { fontSize: number; color: string };

function normalizeSpaces(text: string): string {
  return text.replace(/[  ]/g, " ");
}

function flattenText(nodes: DomNode[]): string {
  const texts: string[] = [];
  const stack = [...nodes].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (isText(node)) texts.push(normalizeSpaces(node.data));
    else if (isElement(node) && !IGNORED_TAGS.has(node.name)) {
      stack.push(...[...node.children].reverse());
    }
  }
  return texts.join("");
}

function toInlineSegments(nodes: DomNode[], depth = 0): Segment[] {
  if (depth > MAX_INLINE_DEPTH) return [flattenText(nodes)];
  const segments: Segment[] = [];
  for (const node of nodes) {
    if (isText(node)) {
      segments.push(normalizeSpaces(node.data));
      continue;
    }
    if (!isElement(node) || IGNORED_TAGS.has(node.name)) continue;
    const children = toInlineSegments(node.children, depth + 1);
    switch (node.name) {
      case "br":
        segments.push("\n");
        break;
      case "strong":
      case "b":
        segments.push({ text: children, bold: true });
        break;
      case "em":
      case "i":
        segments.push({ text: children, italics: true });
        break;
      case "u":
        segments.push({ text: children, decoration: "underline" });
        break;
      case "s":
      case "del":
      case "strike":
        segments.push({ text: children, decoration: "lineThrough" });
        break;
      case "a":
        segments.push({
          text: children,
          decoration: "underline",
          color: LINK_COLOR,
        });
        break;
      default:
        segments.push(...children);
    }
  }
  return segments;
}

function hasText(segments: Segment[]): boolean {
  return segments.some((segment) =>
    typeof segment === "string"
      ? segment.trim().length > 0
      : hasText(
          Array.isArray(segment.text)
            ? segment.text.filter(
                (childSegment): childSegment is Segment =>
                  typeof childSegment === "string" ||
                  (typeof childSegment === "object" && "text" in childSegment),
              )
            : [String(segment.text)],
        ),
  );
}

function paragraph(segments: Segment[], options: Options): Content[] {
  if (!hasText(segments)) return [];
  return [
    {
      text: segments,
      fontSize: options.fontSize,
      color: options.color,
      margin: [0, 0, 0, px(4)],
    },
  ];
}

function separator(): Content {
  return {
    table: { widths: ["*"], body: [[""]] },
    layout: {
      hLineWidth: (index: number) => (index === 0 ? px(1) : 0),
      vLineWidth: () => 0,
      hLineColor: () => SEPARATOR_COLOR,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, px(8), 0, px(8)],
  };
}

function tableRows(node: DomNode, options: Options): Content[] {
  if (!isElement(node)) return [];
  if (node.name === "tr") {
    const cells = node.children.filter(
      (child) =>
        isElement(child) && (child.name === "td" || child.name === "th"),
    );
    return paragraph(
      cells.flatMap((cell, index) => {
        const segments = isElement(cell) ? toInlineSegments(cell.children) : [];
        return index === 0 ? segments : [" ", ...segments];
      }),
      options,
    );
  }
  return node.children.flatMap((child) => tableRows(child, options));
}

function listItem(node: DomNode, options: Options): Content {
  if (!isElement(node)) return "";
  const blocks = convertBlocks(node.children, options);
  return blocks.length === 1 ? blocks[0] : { stack: blocks };
}

function convertBlocks(nodes: DomNode[], options: Options): Content[] {
  const content: Content[] = [];
  let inline: DomNode[] = [];

  const flushInline = () => {
    content.push(...paragraph(toInlineSegments(inline), options));
    inline = [];
  };

  for (const node of nodes) {
    if (!isElement(node)) {
      inline.push(node);
      continue;
    }
    if (IGNORED_TAGS.has(node.name)) continue;

    const name = node.name;
    if (name in HEADING_SIZES) {
      flushInline();
      content.push({
        text: toInlineSegments(node.children),
        bold: true,
        fontSize: HEADING_SIZES[name],
        color: options.color,
        margin: [0, px(8), 0, px(4)],
      });
    } else if (name === "p") {
      flushInline();
      content.push(...paragraph(toInlineSegments(node.children), options));
    } else if (name === "ul" || name === "ol") {
      flushInline();
      const items = node.children
        .filter((child) => isElement(child) && child.name === "li")
        .map((child) => listItem(child, options));
      content.push(
        name === "ul"
          ? {
              ul: items,
              fontSize: options.fontSize,
              color: options.color,
              margin: [0, 0, 0, px(4)],
            }
          : {
              ol: items,
              fontSize: options.fontSize,
              color: options.color,
              margin: [0, 0, 0, px(4)],
            },
      );
    } else if (name === "blockquote") {
      flushInline();
      content.push({
        stack: convertBlocks(node.children, options),
        italics: true,
        margin: [px(16), 0, 0, px(4)],
      });
    } else if (name === "table") {
      flushInline();
      content.push(...tableRows(node, options));
    } else if (name === "hr") {
      flushInline();
      content.push(separator());
    } else if (node.attribs["data-type"] === "callout") {
      flushInline();
      content.push({
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: convertBlocks(node.children, options),
                fillColor: CALLOUT_BACKGROUND,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => px(16),
          paddingRight: () => px(16),
          paddingTop: () => px(12),
          paddingBottom: () => px(8),
        },
        margin: [0, px(4), 0, px(8)],
      });
    } else if (name === "div" || name === "section" || name === "details") {
      flushInline();
      content.push(...convertBlocks(node.children, options));
    } else {
      inline.push(node);
    }
  }
  flushInline();
  return content;
}

export function htmlToPdfmake(
  html: string,
  options: Partial<Options> = {},
): Content[] {
  if (!html) return [];
  const document = parseDocument(html, { decodeEntities: true });
  return convertBlocks(document.children, {
    fontSize: options.fontSize ?? px(14),
    color: options.color ?? TEXT_COLOR,
  });
}
