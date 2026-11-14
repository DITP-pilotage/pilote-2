import { Content, ContentStack } from "pdfmake/interfaces";
import { placePageBreaks } from "@/server/rapport-detaille/pdf/pageBreaks";
import {
  avoidBreakInside,
  rapportDetaillePageBreakBefore,
} from "@/server/rapport-detaille/pdf/section";

const settings = {
  pageSize: { width: 600, height: 500 },
  pageMargins: [50, 50, 50, 50] as [number, number, number, number],
  defaultStyle: { font: "Marianne", fontSize: 10, lineHeight: 1 },
};

function lines(count: number): Content[] {
  return Array.from({ length: count }, (_, index) => `Ligne ${index + 1}`);
}

async function place(groups: Content[]) {
  await placePageBreaks(settings, rapportDetaillePageBreakBefore, groups);
}

describe("placePageBreaks", () => {
  it("repousse à la page suivante un bloc à ne pas couper qui déborde", async () => {
    const block: ContentStack = avoidBreakInside({ stack: lines(10) });

    await place([[{ stack: lines(20) }, block]]);

    expect(block.pageBreak).toBe("before");
  });

  it("laisse en place un bloc à ne pas couper qui tient sur sa page", async () => {
    const block: ContentStack = avoidBreakInside({ stack: lines(10) });

    await place([[{ stack: lines(5) }, block]]);

    expect(block.pageBreak).toBeUndefined();
  });

  it("coupe un bloc plus haut qu'une page s'il commence déjà en haut de page", async () => {
    const block: ContentStack = avoidBreakInside({ stack: lines(80) });

    await place([[block]]);

    expect(block.pageBreak).toBeUndefined();
  });

  it("réévalue les blocs suivants après chaque saut ajouté", async () => {
    const first: ContentStack = avoidBreakInside({ stack: lines(10) });
    const second: ContentStack = avoidBreakInside({ stack: lines(20) });

    await place([[{ stack: lines(20) }, first, second]]);

    expect([first.pageBreak, second.pageBreak]).toEqual(["before", "before"]);
  });
});
