// « CAMPUS PILOTE : Introduction à l'outil » devient « Introduction à l'outil ».
export function nomAffiche(nom: string): string {
  const separateur = nom.indexOf(":");
  if (separateur === -1) return nom;
  const suite = nom.slice(separateur + 1).trim();
  return suite === "" ? nom : suite;
}
