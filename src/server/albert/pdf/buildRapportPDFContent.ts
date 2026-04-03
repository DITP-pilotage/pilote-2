import { Content } from "pdfmake/interfaces";
import {
  COLORS,
  createPageHeader,
  createTable,
  createText,
} from "@/server/evaluation/handlers/pdfFactories";

function createParagraph(text: string): Content {
  return {
    text,
    fontSize: 9,
    color: COLORS.text,
    margin: [0, 0, 0, 8],
  };
}

type ParagraphePartie = {
  type: "paragraphe";
  contenu: string;
};

type TableauPartie = {
  type: "tableau";
  en_tetes: string[];
  lignes: string[][];
};

type SectionPartie = ParagraphePartie | TableauPartie;

export type RapportInput = {
  titre: string;
  date: string;
  resume: string;
  sections: Array<{
    titre: string;
    parties: SectionPartie[];
  }>;
};

export function buildRapportPDFContent(input: RapportInput): Content[] {
  const content: Content[] = [];

  content.push(createPageHeader({ title: input.titre }));

  content.push({
    text: input.date,
    fontSize: 9,
    color: COLORS.textLight,
    margin: [0, 0, 0, 5],
  });

  content.push({
    text: input.resume,
    fontSize: 9,
    italics: true,
    color: COLORS.text,
    margin: [0, 0, 0, 20],
  });

  for (const section of input.sections) {
    content.push({
      text: section.titre,
      fontSize: 12,
      bold: true,
      color: COLORS.primary,
      margin: [0, 10, 0, 8],
    });

    for (const partie of section.parties) {
      if (partie.type === "paragraphe") {
        content.push(createParagraph(partie.contenu));
      }

      if (partie.type === "tableau") {
        const headerRow = partie.en_tetes.map((header) =>
          createText({ text: header, bold: true, fontSize: 8 }),
        );
        const dataRows = partie.lignes.map((ligne) =>
          ligne.map((cellule) => createText({ text: cellule, fontSize: 8 })),
        );
        const widths = partie.en_tetes.map(() => "*");

        content.push(
          createTable([headerRow, ...dataRows], { rowModulo: 1, widths }),
        );
      }
    }
  }

  return content;
}
