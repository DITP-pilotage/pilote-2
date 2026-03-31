import { parseDocument, DomUtils } from "htmlparser2";
import { AnyNode, Text, Element } from "domhandler";
import render from "dom-serializer";

export function truncateHtml(html: string, maxChars: number): string {
  const document = parseDocument(html);
  if (DomUtils.textContent(document).length <= maxChars) {
    return html;
  }

  let remaining = maxChars;

  function truncateNodes(nodes: AnyNode[]): AnyNode[] {
    const result: AnyNode[] = [];
    for (const node of nodes) {
      if (remaining <= 0) break;

      if (node.type === "text") {
        const textNode = node as Text;
        if (textNode.data.length <= remaining) {
          remaining -= textNode.data.length;
          result.push(textNode);
        } else {
          result.push(new Text(textNode.data.slice(0, remaining) + "…"));
          remaining = 0;
        }
      } else if (node.type === "tag") {
        const element = node as Element;
        const truncatedChildren = truncateNodes(element.children as AnyNode[]);
        result.push(
          new Element(element.name, element.attribs, truncatedChildren),
        );
      }
    }
    return result;
  }

  const truncated = truncateNodes(document.children as AnyNode[]);
  return render(truncated);
}
