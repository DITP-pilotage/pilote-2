import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

export type ContenuCsv = { colonnes: string[]; lignes: string[][] };

export const filtrerTerritoires = <
  T extends { territoireCode: string; estApplicable: boolean | null },
>(
  donnees: T[],
  codesTerritoiresSelectionnes: string[],
): T[] =>
  donnees.filter(
    (territoire) =>
      territoire.estApplicable !== false &&
      codesTerritoiresSelectionnes.includes(territoire.territoireCode),
  );

export const genererCsv = (colonnes: string[], lignes: string[][]): string => {
  const entete = colonnes.join(";");
  const corps = lignes.map((ligne) => ligne.join(";")).join("\n");
  return `\uFEFF${entete}\n${corps}`;
};

export const telechargerCsv = (contenu: string, nomFichier: string): void => {
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
};

export const formaterDateCsv = (dateIso: string | null): string => {
  if (!dateIso) return "Non renseigné";
  return PiloteDateFormatter.isoDateFranceMetropolitaine(dateIso);
};
