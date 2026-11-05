import {
  colonnesDetail,
  type LigneDetail,
} from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/getIndicateursACompleter";

const entreGuillemets = (valeur: string) => `"${valeur.replaceAll('"', '""')}"`;

/** Séparateur `;` et BOM UTF-8 : le fichier s'ouvre dans Excel avec ses accents. */
export const csvIndicateursACompleter = ({
  lignes,
  motifs,
}: {
  lignes: LigneDetail[];
  motifs: DetailIndicateursACompleter["motifs"];
}): string => {
  const colonnes = colonnesDetail({ motifs });
  return `﻿${[
    colonnes.map((colonne) => colonne.titre),
    ...lignes.map((ligne) => colonnes.map((colonne) => colonne.valeur(ligne))),
  ]
    .map((cellules) => cellules.map(entreGuillemets).join(";"))
    .join("\r\n")}`;
};
