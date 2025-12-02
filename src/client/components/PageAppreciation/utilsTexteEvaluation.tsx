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
  estVerrouille,
}: {
  estValide: boolean;
  estVerrouille: boolean;
}) => {
  return estVerrouille ? "TRANSMIS" : estValide ? "TRAITÉ" : "À TRAITER";
};
