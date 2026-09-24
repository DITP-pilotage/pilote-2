import { describe, expect, it } from "vitest";

import { markdownToPdfContent } from "@/server/albert/pdf/markdownToPdfContent";

describe("markdownToPdfContent", () => {
  it("n'imprime pas la définition d'un lien de référence", () => {
    const contenu = markdownToPdfContent(
      "Voir [la doc][1].\n\n[1]: https://exemple.fr/doc\n",
    );

    expect(contenu).toMatchObject([
      { text: ["Voir ", { text: ["la doc"] }, "."] },
    ]);
  });

  describe("liste de tâches", () => {
    const contenu = markdownToPdfContent(
      "- [x] Tâche faite\n- [ ] Tâche à faire\n",
    );

    it("rend chaque tâche sur une seule ligne, case puis texte, sans puce", () => {
      expect(contenu).toMatchObject([
        {
          ul: [
            {
              listType: "none",
              columns: [
                { canvas: expect.any(Array) },
                { text: ["Tâche faite"] },
              ],
            },
            {
              listType: "none",
              columns: [
                { canvas: expect.any(Array) },
                { text: ["Tâche à faire"] },
              ],
            },
          ],
        },
      ]);
    });

    it("coche la case d'une tâche faite et laisse vide celle d'une tâche à faire", () => {
      expect(contenu).toMatchObject([
        {
          ul: [
            {
              columns: [
                { canvas: [{ type: "rect" }, { type: "polyline" }] },
                {},
              ],
            },
            { columns: [{ canvas: [{ type: "rect" }] }, {}] },
          ],
        },
      ]);
    });
  });
});
