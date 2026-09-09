import type { CitedChantier } from "@/components/_commons/ChatUI/extractCitedChantiers";

// Minimal mdast types: @types/mdast is not resolvable under pnpm strict, and
// only these nodes are handled here.
export type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
};

export type ChantierLinkOptions = {
  chantiers: Map<string, CitedChantier>;
  buildUrl: (chantier: CitedChantier) => string;
};

// An openweight model does not stick to the ASCII hyphen: it commonly emits
// U+2011 inside the id ("CH\u2011173") and an em dash preceded by a narrow
// no-break space before the name. We accept the whole Unicode dash family, and
// the URL is always built from the canonical id, never from the spelling found
// in the text.
const DASHES = "-\u2010\u2011\u2012\u2013\u2014\u2212";
const ID_PATTERN = new RegExp(`\\bch[${DASHES}](\\d{3,})\\b`, "gi");
const SEPARATOR_PATTERN = new RegExp(`^\\s*[${DASHES}]\\s*`, "u");

const splitText = ({
  text,
  chantiers,
  buildUrl,
}: ChantierLinkOptions & { text: string }): MarkdownNode[] | null => {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ID_PATTERN)) {
    const start = match.index;
    if (start < cursor) continue;

    const chantier = chantiers.get(`CH-${match[1]}`);
    if (!chantier) continue;

    let end = start + match[0].length;
    const separator = SEPARATOR_PATTERN.exec(text.slice(end));
    if (separator) {
      const afterSeparator = end + separator[0].length;
      if (text.startsWith(chantier.nom, afterSeparator)) {
        end = afterSeparator + chantier.nom.length;
      }
    }

    if (start > cursor) {
      nodes.push({ type: "text", value: text.slice(cursor, start) });
    }
    nodes.push({
      type: "link",
      url: buildUrl(chantier),
      children: [{ type: "text", value: text.slice(start, end) }],
    });
    cursor = end;
  }

  if (nodes.length === 0) return null;
  if (cursor < text.length) {
    nodes.push({ type: "text", value: text.slice(cursor) });
  }
  return nodes;
};

const replaceInChildren = (
  node: MarkdownNode,
  options: ChantierLinkOptions,
): void => {
  if (!node.children) return;

  const children: MarkdownNode[] = [];
  let modified = false;

  for (const child of node.children) {
    if (child.type === "link" || child.type === "linkReference") {
      children.push(child);
      continue;
    }

    if (child.type === "text" && child.value !== undefined) {
      const replacement = splitText({ ...options, text: child.value });
      if (replacement) {
        children.push(...replacement);
        modified = true;
        continue;
      }
      children.push(child);
      continue;
    }

    replaceInChildren(child, options);
    children.push(child);
  }

  if (modified) node.children = children;
};

export const remarkChantierLinks =
  (options: ChantierLinkOptions) =>
  (tree: MarkdownNode): void => {
    replaceInChildren(tree, options);
  };
