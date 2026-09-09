import { buildRapportPDFContent } from "@/server/albert/pdf/buildRapportPDFContent";
import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";
import { RapportInput } from "@/server/albert/rapportInput";

export function genererRapportPDF(input: RapportInput): Promise<Buffer> {
  const content = buildRapportPDFContent(input);
  return creerBufferPdf(content);
}
