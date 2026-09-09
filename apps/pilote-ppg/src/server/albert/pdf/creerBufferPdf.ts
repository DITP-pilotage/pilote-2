import { createPdf } from "pdfmake/build/pdfmake";
import * as vfs from "pdfmake/build/vfs_fonts";
import { Content } from "pdfmake/interfaces";

export function creerBufferPdf(content: Content[]): Promise<Buffer> {
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
      // @ts-expect-error mauvais types sur la lib
      vfs,
    ).getBuffer(resolve);
  });
}
