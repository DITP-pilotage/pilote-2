import { marked } from "marked";

export function markdownVersHtmlPressePapiers(texte: string): string {
  return marked.parse(texte, { async: false }) as string;
}
