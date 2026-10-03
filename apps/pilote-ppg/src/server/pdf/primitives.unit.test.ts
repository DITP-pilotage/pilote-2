import { TDocumentDefinitions } from "pdfmake/interfaces";
import { withMarianne } from "@/server/pdf/pdfmake";
import {
  alertePdf,
  badgePdf,
  barreDeProgressionPdf,
  blocPdf,
  encartPdf,
  publicationRubriquePdf,
  separatorPdf,
  tablePdf,
} from "@/server/pdf/primitives";
import { px } from "@/server/pdf/units";

function json(value: unknown) {
  return JSON.stringify(value);
}

async function renders(content: TDocumentDefinitions["content"]) {
  const buffer = await withMarianne()
    .createPdf({ content, defaultStyle: { font: "Marianne" } })
    .getBuffer();
  return buffer.subarray(0, 4).toString();
}

describe("badgePdf", () => {
  it("reprend les couleurs de la variante, en gras et en majuscules", async () => {
    const badge = badgePdf("En hausse", "succes");

    expect(json(badge)).toContain('"text":"EN HAUSSE"');
    expect(json(badge)).toContain("#B8FEC9");
    expect(json(badge)).toContain("#18753C");
    expect(json(badge)).toContain(`"fontSize":${px(12)}`);
    expect(await renders([badge])).toBe("%PDF");
  });

  it("prend la taille md", () => {
    expect(json(badgePdf("x", "info", { size: "md" }))).toContain(
      `"fontSize":${px(14)}`,
    );
  });
});

describe("barreDeProgressionPdf", () => {
  it("affiche « - % » sans remplissage quand la valeur est absente", () => {
    const barre = barreDeProgressionPdf({
      valeur: null,
      size: "sm",
      background: "blanc",
      fill: "#000091",
      label: "side",
      width: 100,
    });

    expect(json(barre)).toContain("- %");
    expect(json(barre)).not.toContain("#000091");
  });

  it("arrondit la valeur et remplit au prorata", async () => {
    const barre = barreDeProgressionPdf({
      valeur: 42.6,
      size: "md",
      background: "gris-clair",
      fill: "#666666",
      label: "top",
      width: 200,
    });

    expect(json(barre)).toContain("43 %");
    expect(json(barre)).toContain(`"w":${200 * 0.426}`);
    expect(await renders([barre])).toBe("%PDF");
  });
});

describe("blocPdf", () => {
  it("dessine un bandeau de titre et une bordure d'impression", async () => {
    const bloc = blocPdf({ titre: "France", content: "contenu" });

    expect(json(bloc)).toContain("France");
    expect(json(bloc)).toContain("#E3E3FD");
    expect(await renders([bloc])).toBe("%PDF");
  });
});

describe("encartPdf", () => {
  it("pose le fond bleu de l'encart", () => {
    expect(json(encartPdf("Vue d'ensemble"))).toContain("#E3E3FD");
  });
});

describe("alertePdf", () => {
  it("affiche le titre d'une alerte d'information", async () => {
    const alerte = alertePdf({
      type: "info",
      titre: "Aucun indicateur n'est applicable pour le territoire sélectionné",
    });

    expect(json(alerte)).toContain("#0063CB");
    expect(json(alerte)).toContain("Aucun indicateur");
    expect(await renders([alerte])).toBe("%PDF");
  });
});

describe("publicationRubriquePdf", () => {
  it("affiche un badge « Non renseigné » sans contenu", () => {
    const rubrique = publicationRubriquePdf({
      titre: "Notre ambition",
      dateEtAuteur: null,
      html: null,
    });

    expect(json(rubrique)).toContain("NON RENSEIGNÉ");
  });

  it("affiche la date, l'auteur et le contenu", async () => {
    const rubrique = publicationRubriquePdf({
      titre: "Notre ambition",
      dateEtAuteur: "Mis à jour le 15/09/2026 | Par Jeanne Martin",
      html: "<p>Texte</p>",
    });

    expect(json(rubrique)).toContain("Mis à jour le 15/09/2026");
    expect(json(rubrique)).toContain("Texte");
    expect(await renders([rubrique])).toBe("%PDF");
  });
});

describe("tablePdf", () => {
  it("rend l'en-tête sur fond bleu et toutes les lignes", async () => {
    const table = tablePdf({
      headers: ["Chantiers", "Météo"],
      widths: ["*", 80],
      rows: [["A", "B"]],
    });

    expect(json(table)).toContain("#E3E3FD");
    expect(await renders([table])).toBe("%PDF");
  });
});

describe("separatorPdf", () => {
  it("trace un trait gris", () => {
    const separator = separatorPdf();
    const layout =
      typeof separator === "object" && "layout" in separator
        ? separator.layout
        : undefined;

    expect(
      typeof layout === "object" && typeof layout.hLineColor === "function"
        ? layout.hLineColor(0, { table: { body: [] } }, 0)
        : null,
    ).toBe("#DDDDDD");
  });
});
