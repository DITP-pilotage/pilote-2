export const genererContenuCsv = (lignes: string[][]): string => {
  const bom = "\uFEFF";
  const corps = lignes
    .map((ligne) =>
      ligne.map((cellule) => `"${cellule.replace(/"/g, '""')}"`).join(";"),
    )
    .join("\n");
  return bom + corps;
};

export const telechargerCsv = (contenu: string, nomFichier: string): void => {
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${nomFichier}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
};
