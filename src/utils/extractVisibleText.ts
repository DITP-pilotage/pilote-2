import { parseDocument, DomUtils } from "htmlparser2";

export function extractVisibleText(html: string): string {
  const document = parseDocument(html);
  return DomUtils.textContent(document);
}
