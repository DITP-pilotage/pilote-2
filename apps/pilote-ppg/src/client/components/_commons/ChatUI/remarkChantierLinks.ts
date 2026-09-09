// Minimal mdast types: @types/mdast is not resolvable under pnpm strict, and
// only these nodes are handled here.
export type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
};

export type ChantierLinkOptions = {
  buildUrl: (chantierId: string) => string;
};

// An openweight model does not stick to the ASCII hyphen: it commonly emits
// U+2011 inside the id ("CH‑173"). We accept the whole Unicode dash
// family, and the URL is always built from the canonical id, never from the
// spelling found in the text.
const DASHES = "-‐‑‒–—−";
const ID_PATTERN = new RegExp(`\\bch[${DASHES}](\\d{3,})\\b`, "gi");

const splitText = ({
  text,
  buildUrl,
}: ChantierLinkOptions & { text: string }): MarkdownNode[] | null => {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ID_PATTERN)) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > cursor) {
      nodes.push({ type: "text", value: text.slice(cursor, start) });
    }
    nodes.push({
      type: "link",
      url: buildUrl(`CH-${match[1]}`),
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
