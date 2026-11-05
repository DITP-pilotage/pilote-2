import {
  PERSON_REFERENCE_PATTERN,
  isOnlyPersonReference,
  normalizePersonId,
} from "@/shared/personne/personReference";
import type { MarkdownNode } from "@/components/_commons/ChatUI/remarkChantierLinks";

type PersonMentionNode = MarkdownNode & {
  data: { hName: "span"; hProperties: { dataPersonId: string } };
};

const personMention = (id: string): PersonMentionNode => ({
  type: "personMention",
  data: { hName: "span", hProperties: { dataPersonId: id } },
  children: [{ type: "text", value: "une personne" }],
});

const splitText = (text: string): MarkdownNode[] | null => {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(PERSON_REFERENCE_PATTERN)) {
    const start = match.index;
    if (start > cursor) {
      nodes.push({ type: "text", value: text.slice(cursor, start) });
    }
    nodes.push(personMention(normalizePersonId(match[1])));
    cursor = start + match[0].length;
  }

  if (nodes.length === 0) return null;
  if (cursor < text.length) {
    nodes.push({ type: "text", value: text.slice(cursor) });
  }
  return nodes;
};

const replaceInChildren = (node: MarkdownNode): void => {
  if (!node.children) return;

  const children: MarkdownNode[] = [];
  let modified = false;

  for (const child of node.children) {
    if (child.type === "link" || child.type === "linkReference") {
      children.push(child);
      continue;
    }

    if (child.type === "inlineCode" && child.value !== undefined) {
      const id = isOnlyPersonReference(child.value);
      if (id) {
        children.push(personMention(id));
        modified = true;
        continue;
      }
      children.push(child);
      continue;
    }

    if (child.type === "text" && child.value !== undefined) {
      const replacement = splitText(child.value);
      if (replacement) {
        children.push(...replacement);
        modified = true;
        continue;
      }
      children.push(child);
      continue;
    }

    replaceInChildren(child);
    children.push(child);
  }

  if (modified) node.children = children;
};

export const remarkPersonReferences =
  () =>
  (tree: MarkdownNode): void => {
    replaceInChildren(tree);
  };
