import { FunctionComponent } from "react";

const COULEUR = "#666666";
const ESPACEMENT = 1;
const ÉPAISSEUR = 0.375;

const nappesParTaille = new Map<number, string>();

// Une nappe de diagonales à 45° couvrant toute la zone, à découper ensuite avec
// un clipPath. Un pattern SVG ferait le même rendu en moins de code, mais
// Firefox abandonne la peinture de la page entière quand il doit en résoudre un
// à l'impression (PIL-1491).
function tracerNappe(taille: number): string {
  const nappeConnue = nappesParTaille.get(taille);
  if (nappeConnue) return nappeConnue;

  const segments = [];
  for (let départ = -taille; départ < taille * 2; départ += ESPACEMENT) {
    segments.push(`M${départ} ${taille}L${départ + taille} 0`);
  }

  const nappe = segments.join("");
  nappesParTaille.set(taille, nappe);
  return nappe;
}

export const HachuresDiagonales: FunctionComponent<{ taille: number }> = ({
  taille,
}) => (
  // style et non attributs : les conteneurs de cartes posent un `stroke` en CSS
  // (stroke-white), qui l'emporterait sur des attributs de présentation.
  <path
    d={tracerNappe(taille)}
    style={{ fill: "none", stroke: COULEUR, strokeWidth: ÉPAISSEUR }}
  />
);
