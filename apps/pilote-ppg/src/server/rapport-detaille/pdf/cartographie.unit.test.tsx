import { withMarianne } from "@/server/pdf/pdfmake";
import {
  avancementCarteSvg,
  meteoCarteSvg,
} from "@/server/rapport-detaille/pdf/cartographie";
import {
  getAvancementFill,
  getAvancementLegend,
} from "@/components/_commons/Cartographie/CartographieAvancement/avancementFill";
import {
  getMeteoFill,
  getMeteoLegend,
} from "@/components/_commons/Cartographie/CartographieMétéo/meteoFill";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";

describe("getAvancementFill", () => {
  it("colore par tranche de 10 points sur la valeur arrondie", () => {
    const fill = (
      valeur: number | null,
      estApplicable: boolean | null = true,
    ) =>
      getAvancementFill(
        valeur,
        ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
        estApplicable,
      );

    expect(fill(0)).toBe("#e6e6f4");
    expect(fill(89.6)).toBe("#000091");
    expect(fill(null)).toBe("#bababa");
    expect(fill(50, false)).toBe("hachures");
  });
});

describe("getAvancementLegend", () => {
  it("masque les entrées non applicable et non renseigné quand aucun territoire n'est concerné", () => {
    const legend = getAvancementLegend(
      [
        {
          valeur: 10,
          valeurAnnuelle: 10,
          territoireCode: "REG-11",
          estApplicable: true,
        },
      ],
      ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
    );

    expect(legend).toHaveLength(10);
  });
});

describe("getMeteoFill / getMeteoLegend", () => {
  it("colore selon la météo", () => {
    expect(getMeteoFill("ORAGE", ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS, true)).toBe(
      "#B34000",
    );
    expect(
      getMeteoFill("NON_RENSEIGNEE", ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS, true),
    ).toBe("#bababa");
  });

  it("garde l'entrée non renseignée quand un territoire n'a pas de météo", () => {
    const legend = getMeteoLegend(
      [
        {
          valeur: "NON_RENSEIGNEE",
          territoireCode: "REG-11",
          estApplicable: true,
        },
      ],
      ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
    );

    expect(legend.map((entry) => entry.libellé)).toContain(
      "Territoire pour lequel la météo n'est pas renseignée",
    );
  });
});

describe("cartes SVG", () => {
  it("dessine tous les départements et les frontières régionales en maille départementale", async () => {
    const svg = avancementCarteSvg({
      territoireCode: "NAT-FR",
      selectedMaille: "departementale",
      données: [
        {
          valeur: 50,
          valeurAnnuelle: 95,
          territoireCode: "DEPT-75",
          estApplicable: true,
        },
      ],
    });

    expect(svg.match(/<path/g)?.length ?? 0).toBeGreaterThan(100);
    expect(svg).toContain('fill="#000091"');
    expect(svg).toContain('stroke-width="0.4"');
    expect(svg).not.toContain("class=");
    const buffer = await withMarianne()
      .createPdf({ content: [{ svg, width: 300 }] })
      .getBuffer();
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("hachure les territoires non applicables et entoure le territoire sélectionné", () => {
    const svg = meteoCarteSvg({
      territoireCode: "REG-11",
      selectedMaille: "regionale",
      données: [
        { valeur: "SOLEIL", territoireCode: "REG-11", estApplicable: false },
      ],
    });

    expect(svg).toContain("clip-path=");
    expect(svg).toContain('stroke="#FCC63A"');
  });
});
