import { genererContenuCsv } from "@/client/utils/csv";
import {
  colonnesDetail,
  type LigneDetail,
} from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/sortieIndicateursACompleter";

export const csvIndicateursACompleter = ({
  lignes,
  motifs,
}: {
  lignes: LigneDetail[];
  motifs: DetailIndicateursACompleter["motifs"];
}): string => {
  const colonnes = colonnesDetail({ motifs });
  return genererContenuCsv([
    colonnes.map((colonne) => colonne.titre),
    ...lignes.map((ligne) => colonnes.map((colonne) => colonne.valeur(ligne))),
  ]);
};
