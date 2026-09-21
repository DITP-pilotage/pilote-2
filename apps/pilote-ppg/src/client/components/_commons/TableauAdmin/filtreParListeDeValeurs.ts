import type { Row } from "@tanstack/react-table";

export const filtreParListeDeValeurs = <TRow>(
  row: Row<TRow>,
  columnId: string,
  valeursAutorisees: string[],
) => {
  const valeur = row.getValue<string | null>(columnId);
  return valeur !== null && valeursAutorisees.includes(valeur);
};
