export const formatterTitreEvaluation = ({
  code,
  libelle,
}: {
  code: string;
  libelle: string;
}) => {
  if (code.startsWith("DEPT")) {
    return `${code.split("-")[1]} - ${libelle}`;
  }

  if (code.startsWith("REG")) {
    return `Région ${libelle}`;
  }
  return libelle;
};

export const formatterTexteCompletion = ({
  estValide,
}: {
  estValide: boolean;
}) => {
  return estValide ? "TRAITÉ" : "À TRAITER";
};
