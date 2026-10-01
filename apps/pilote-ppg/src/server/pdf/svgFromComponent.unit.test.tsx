import { pdfmake } from "@/server/pdf/pdfmake";
import {
  flattenSvgClasses,
  iconSvg,
  jaugeSmallSvg,
  jaugeSvg,
  meteoPictoSvg,
} from "@/server/pdf/svgFromComponent";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";

async function renderInPdf(svg: string) {
  return pdfmake.createPdf({ content: [{ svg, width: 100 }] }).getBuffer();
}

describe("flattenSvgClasses", () => {
  it("remplace les classes de couleur Tailwind par des attributs", () => {
    expect(flattenSvgClasses('<rect class="fill-pilote-jauge-fond"/>')).toBe(
      '<rect fill="#D9D9D9"/>',
    );
    expect(flattenSvgClasses('<path class="stroke-white"/>')).toBe(
      '<path stroke="#FFFFFF"/>',
    );
    expect(
      flattenSvgClasses('<path class="fill-none [stroke-width:0.4]"/>'),
    ).toBe('<path fill="none" stroke-width="0.4"/>');
  });

  it("supprime les classes sans effet sur le dessin", () => {
    expect(
      flattenSvgClasses(
        '<path class="hover:opacity-[0.72] cursor-pointer" d="M0 0"/>',
      ),
    ).toBe('<path d="M0 0"/>');
  });

  it("remplace currentColor par la couleur demandée", () => {
    expect(
      flattenSvgClasses('<path fill="currentColor"/>', {
        currentColor: "#000091",
      }),
    ).toBe('<path fill="#000091"/>');
  });

  it("rend des identifiants compatibles avec le moteur SVG de pdfmake", () => {
    expect(
      flattenSvgClasses(
        '<clipPath id="masque-«r1»"></clipPath><g clip-path="url(#masque-«r1»)"></g>',
      ),
    ).toBe(
      '<clipPath id="masque-r1"></clipPath><g clip-path="url(#masque-r1)"></g>',
    );
  });
});

describe("jaugeSvg", () => {
  it("dessine le fond gris et la valeur dans la couleur de la jauge", async () => {
    const svg = jaugeSvg(50, "bleu", "lg");

    expect(svg).toContain('fill="#D9D9D9"');
    expect(svg).toContain('fill="#000091"');
    expect(svg).not.toContain("class=");
    expect((await renderInPdf(svg)).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("ne dessine pas de valeur quand le pourcentage est absent", () => {
    expect(jaugeSvg(null, "bleu", "lg")).not.toContain('fill="#000091"');
  });

  it("dessine la petite jauge", () => {
    expect(jaugeSmallSvg(30, "orange")).toContain('fill="#FC5D00"');
  });
});

describe("meteoPictoSvg", () => {
  it("rend le picto d'une météo renseignée", () => {
    expect(meteoPictoSvg("SOLEIL")).toContain("#FFCA00");
  });

  it("ne rend rien pour une météo non renseignée", () => {
    expect(meteoPictoSvg("NON_RENSEIGNEE")).toBeNull();
    expect(meteoPictoSvg("NON_NECESSAIRE")).toBeNull();
  });
});

describe("iconSvg", () => {
  it("colore l'icône", async () => {
    const svg = iconSvg(WarningIcon, "#B34000");

    expect(svg).toContain("#B34000");
    expect(svg).not.toContain("currentColor");
    expect((await renderInPdf(svg)).subarray(0, 4).toString()).toBe("%PDF");
  });
});
