import { createPdf } from "pdfmake/build/pdfmake";
import * as vfs from "pdfmake/build/vfs_fonts";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { buildRapportPDFContent } from "@/server/albert/pdf/buildRapportPDFContent";
import { RapportInput } from "@/server/albert/rapportInput";

function genererRapportPDF(input: RapportInput): Promise<Buffer> {
  const content = buildRapportPDFContent(input);

  const pdf = {
    content,
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
  };

  return new Promise<Buffer>((resolve) => {
    createPdf(
      pdf,
      {},
      {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
        Courier: {
          normal: "Courier",
          bold: "Courier-Bold",
          italics: "Courier-Oblique",
          bolditalics: "Courier-BoldOblique",
        },
      },
      vfs,
    ).getBuffer(resolve);
  });
}

export async function exportRapportPDF(
  input: RapportInput,
): Promise<{ url: string }> {
  const buffer = await genererRapportPDF(input);

  const exportId = randomUUID();
  const exportsDir = join(process.cwd(), "public", "exports");

  await mkdir(exportsDir, { recursive: true });
  await writeFile(join(exportsDir, `${exportId}.pdf`), buffer);

  return { url: `/exports/${exportId}.pdf` };
}
