import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reprend la regle `no-restricted-syntax` de l'ancienne configuration ESLint, qui
 * interdisait l'apostrophe typographique. oxlint n'a pas d'equivalent : il ne
 * permet pas d'interdire un motif par selecteur AST.
 *
 * Le test est plus large que la regle, qui ne regardait que les litteraux et le
 * texte JSX. Elle laissait donc passer les templates, ou l'apostrophe est tout
 * aussi indesirable.
 *
 * Une ligne portant `apostrophe-typographique-autorisee`, ou precedee d'un
 * commentaire qui le porte, est ignoree — l'equivalent du `eslint-disable-next-line`
 * qu'il remplace.
 */
const APOSTROPHE_TYPOGRAPHIQUE = "’";
const DEROGATION = "apostrophe-typographique-autorisee";

const RACINES = ["src", "tests"];

const chercherLesOccurrences = (chemin: string) => {
  const lignes = readFileSync(chemin, "utf8").split("\n");

  return lignes.flatMap((ligne, index) => {
    if (!ligne.includes(APOSTROPHE_TYPOGRAPHIQUE)) return [];
    const precedentes = lignes.slice(Math.max(0, index - 3), index + 1);
    if (precedentes.some((l) => l.includes(DEROGATION))) return [];
    return [`${chemin}:${index + 1}`];
  });
};

describe("apostrophe typographique", () => {
  it("n'apparait dans aucune source, sauf derogation explicite", () => {
    const sources = RACINES.flatMap((racine) =>
      globSync(`${racine}/**/*.{ts,tsx}`, { cwd: process.cwd() }),
    ).filter(
      (chemin) => !chemin.endsWith("apostropheTypographique.unit.test.ts"),
    );

    const occurrences = sources.flatMap((chemin) =>
      chercherLesOccurrences(join(process.cwd(), chemin)).map((o) =>
        o.replace(`${process.cwd()}/`, ""),
      ),
    );

    expect(occurrences).toEqual([]);
  });
});
