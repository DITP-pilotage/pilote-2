import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";
import { markdownToPdfContent } from "@/server/albert/pdf/markdownToPdfContent";

export function genererPdfDepuisMarkdown(texte: string): Promise<Buffer> {
  return creerBufferPdf(markdownToPdfContent(texte));
}
